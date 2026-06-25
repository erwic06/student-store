# Student Store API — System Spec

> Source of truth for all schema and route decisions. Fill each section before
> writing `schema.prisma`, models, or route handlers.

> **Naming convention:** all Prisma fields and JSON keys are **camelCase** (idiomatic
> Prisma; matches the already-committed `seed.js`). The seed JSON files use snake_case
> (`image_url`, `customer_id`, `created_at`) and are mapped to camelCase on read. The
> provided frontend currently reads snake_case (`product.image_url`); that gets reconciled
> in Milestone 6 ("Adjust the frontend as necessary").

---

## Section 1: Data Models

> For each model: every field (name, Prisma type, required/optional, default),
> the primary key (and whether it auto-increments), relationships/foreign keys,
> and cascade behavior on parent deletion.

### Product

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key |
| name | String | yes | — | |
| description | String | yes | — | |
| price | Float | yes | — | Float maps to Postgres double; fine for this project |
| imageUrl | String | yes | — | snake_case `image_url` in seed JSON → mapped on read |
| category | String | yes | — | e.g. Apparel, Books, Supplies, Snacks, Accessories |

- **Primary key:** `id`, auto-increments.
- **Relationships:** one Product → many OrderItem.
- **Cascade behavior:** deleting a Product deletes all OrderItems referencing it.

### Order

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key |
| name | String | yes | — | Customer name from checkout form |
| email | String? | no | — | Optional; the email-filter stretch was dropped, so the checkout form collects no email |
| dormNumber | String? | no | — | Optional; collected by frontend (`dorm_number`) |
| totalPrice | Float | yes | — | Computed server-side during order creation |
| status | String | yes | `@default("pending")` | String is fine per guide |
| createdAt | DateTime | yes | `@default(now())` | Auto-populated |

- **Primary key:** `id`, auto-increments.
- **Relationships:** one Order → many OrderItem.
- **Cascade behavior:** deleting an Order deletes all OrderItems referencing it.

### OrderItem

> Sits at the intersection of two relationships (Product and Order).

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key |
| orderId | Int | yes (FK) | — | → Order.id |
| productId | Int | yes (FK) | — | → Product.id |
| quantity | Int | yes | — | |
| price | Float | yes | — | Price **at time of purchase** (copied from Product.price) |

- **Primary key:** `id`, auto-increments.
- **Relationships (foreign keys):** `orderId` → Order, `productId` → Product. Both use
  `@relation(..., onDelete: Cascade)`.
- **Cascade behavior:** an OrderItem is removed automatically when its parent Order or
  Product is deleted.

### Cascade Delete Rules (plain language)

> Document the dependency chain before the schema enforces it.

1. Deleting a **Product** → every OrderItem with that `productId` is also deleted.
2. Deleting an **Order** → every OrderItem with that `orderId` is also deleted.

OrderItem is the child of both Order and Product; the cascade lives on the two FK
relations defined in OrderItem.

---

## Section 2: API Contract

**Standard error response shape:** `{ "error": "message" }`

> For each endpoint: HTTP method + path, request shape (body / route params /
> query params), success status + body shape, and at least one error case
> (status + error body). All JSON keys are camelCase.

### Products

#### GET /products
- **Request:** optional query params (see below).
- **Success:** `200` → `[ Product, ... ]`.
- **Error:** `500` → `{ "error": "..." }`.

##### Query Parameters
| Param | Values | Behavior |
|-------|--------|----------|
| `category` | any category string (e.g. `Apparel`) | Filters to products in that exact category. An unmatched value returns `[]` (not an error). |
| `sort` | `price` \| `name` | Orders results ascending by that field. Any other/empty value is ignored. |

- **Default (no params):** return all products, unordered (DB insertion order).
- Params combine: `?category=Apparel&sort=price` filters then sorts.

#### GET /products/:id
- **Request:** route param `id`.
- **Success:** `200` → `Product`.
- **Error:** `404` → `{ "error": "Product not found" }`.

#### POST /products
- **Request body:** `{ name, description, price, imageUrl, category }`.
- **Success:** `201` → created `Product`.
- **Error:** `400` → `{ "error": "Missing required field..." }`.

#### PUT /products/:id
- **Request body / params:** route param `id`; body = any subset of product fields.
- **Success:** `200` → updated `Product`.
- **Error:** `404` → `{ "error": "Product not found" }`.

#### DELETE /products/:id
- **Request:** route param `id`.
- **Success:** `204` (no body). *(Convention: 204 no-body on delete; applied consistently
  across all DELETE endpoints.)*
- **Error:** `404` → `{ "error": "Product not found" }`.

### Orders

#### GET /orders
- **Request:** none. (The `?email=` filter stretch was dropped; `email` is now optional.)
- **Success:** `200` → `[ Order, ... ]`.
- **Error:** `500` → `{ "error": "..." }`.

#### GET /orders/:id
- **Request:** route param `id`.
- **Success:** `200` → `Order` **with nested `orderItems` array**.
- **Error:** `404` → `{ "error": "Order not found" }`.

#### POST /orders
> More complex than a standard create. Body includes order metadata
> (customer info, status) **and** an array of order items. Response includes
> the created order **with** its associated items.

- **Request body:**
  - Order metadata: `name`, `email`, `dormNumber`.
  - `items[]`: array of `{ productId, quantity }`.

  ```json
  {
    "name": "Ada Lovelace",
    "email": "ada@college.edu",
    "dormNumber": "B12",
    "items": [ { "productId": 1, "quantity": 2 }, { "productId": 4, "quantity": 1 } ]
  }
  ```
- **Success:** `201` → the created `Order` with its `orderItems` nested and `totalPrice`
  computed server-side.
- **Error:**
  - `400` → `{ "error": "Order must contain at least one item" }`.
  - `400` → `{ "error": "Product <id> does not exist" }`.

#### PUT /orders/:id
- **Request body / params:** route param `id`; body e.g. `{ "status": "completed" }`.
- **Success:** `200` → updated `Order`.
- **Error:** `404` → `{ "error": "Order not found" }`.

#### DELETE /orders/:id
- **Request:** route param `id`.
- **Success:** `204` (no body).
- **Error:** `404` → `{ "error": "Order not found" }`.

### Added Endpoints (stretch)

#### GET /order-items
- **Request:** none.
- **Success:** `200` → `[ OrderItem, ... ]` (all order items, every order).
- **Error:** `500` → `{ "error": "..." }`.

#### POST /orders/:orderId/items
> Add a single item to an existing order. The parent order's `totalPrice` is
> recomputed and persisted in the same transaction.

- **Request:** route param `orderId`; body `{ productId, quantity }`.
- **Success:** `201` → the created `OrderItem`.
- **Error:**
  - `404` → `{ "error": "Order not found" }`.
  - `404` → `{ "error": "Product not found" }`.
  - `400` → `{ "error": "productId and quantity are required" }`.

---

## Section 3: Transactional Flow — POST /orders

> Step-by-step description of what happens at the data layer. Must be atomic:
> if creating any order item fails, the whole operation rolls back.

### Request body shape

```json
{
  "name": "Ada Lovelace",
  "email": "ada@college.edu",
  "dormNumber": "B12",
  "items": [ { "productId": 1, "quantity": 2 }, { "productId": 4, "quantity": 1 } ]
}
```

### Steps (in order)

All steps below run inside one `prisma.$transaction`.

1. Validate that `items` is a non-empty array. If not → respond
   `400 { "error": "Order must contain at least one item" }`.
2. Look up every `productId` in `items` (e.g. `findMany` on the set of ids). If any id is
   missing → throw → transaction rolls back → respond
   `400 { "error": "Product <id> does not exist" }`.
3. Compute each line price from the looked-up `Product.price` (× `quantity`) and sum them
   into `totalPrice` (server-side; never trust a client-sent total).
4. Create the `Order` row (`name`, `email`, `dormNumber`, `status: "pending"`,
   `totalPrice`).
5. Create the `OrderItem` rows linked via `orderId`, each storing `price` = the product
   price at purchase time.
6. Return the order with `orderItems` included.

### Total price calculation

> When and how is the total computed and stored?

Computed in step 3 from authoritative DB prices (not from any client-supplied value),
then stored on the Order in step 4.

### Atomicity

> Which Prisma operations run inside the transaction? What guarantees rollback?

Steps 2–5 (product lookup, Order create, OrderItem creates) all run inside
`prisma.$transaction`. Any throw — e.g. a nonexistent product — aborts the whole
transaction, so no partial Order or OrderItems persist.

### Failure case: item references a nonexistent product

> What happens? What is the response status and body? What state is the
> database left in?

The product lookup in step 2 throws, the transaction rolls back, the database is left
unchanged, and the response is `400 { "error": "Product <id> does not exist" }`.

---

## Decisions Log — Product Model

- **Schema translation that went smoothly:** `price` as `Float` maps cleanly to Postgres
  `double precision`; fine for this project's currency values.
- **Field decision made during implementation:** kept Product to exactly the six spec fields
  (no `@updatedAt`/timestamps) — the frontend doesn't need them and the spec is the contract.
- **Shared client decision:** introduced `src/prisma.js` exporting a single `PrismaClient`
  instance, imported by every model, instead of instantiating per model (avoids multiple
  connection pools). The seed script keeps its own client since it runs as a standalone process.
- **Infra fixes folded in:** moved `seed.js` → `prisma/seed.js` so its `../data` paths resolve,
  set `package.json` `prisma.seed` to `node prisma/seed.js`, and pinned the `prisma` CLI to
  `6.19.3` to match `@prisma/client` (bare `npx prisma` pulled CLI v7, a cross-major mismatch).
- **Route behavior:** `DELETE` returns `204` no-body; `GET/:id`, `PUT`, `DELETE` return
  `404 { error: "Product not found" }`; `POST` validates all five fields → `400`. No spec change.

## Decisions Log — Order Creation Transaction

- **What the Transactional Flow spec got right:** the six-step ordering (validate → lookup
  products → compute total → create Order → create OrderItems → return with items) translated
  to code 1:1. Doing it all inside one `prisma.$transaction(async tx => …)` and using nested
  `orderItems.create` keeps it to a single transactional Order create call.
- **What the spec missed (and is now fixed in code):** the spec mentioned an empty-`items`
  guard inline (step 1) but didn't separate it from "client fault" vs "server fault" errors.
  Introduced `OrderValidationError` so the route can map *only* those throws to `400` and any
  other failure stays `500`. Empty items, missing product → 400; DB outage → 500.
- **How the transaction error handling works:** `prisma.$transaction` runs all queries on a
  single connection inside a real Postgres `BEGIN`/`COMMIT`. Any throw inside the callback
  causes `ROLLBACK` — the Order row and any half-written OrderItem rows are discarded. That
  is why a bad `productId` leaves the orders count unchanged.
- **One thing I would design differently:** the model layer currently knows about HTTP-shaped
  validation messages (`"Product 99 does not exist"`). For a larger system I would have it
  throw a structured `{ code: "PRODUCT_NOT_FOUND", productId }` and let the route format the
  message. Acceptable here because the spec dictates the exact wire string.

## Spec Reconciliation — Milestone 4 (Schema Audit)

### Schema vs. spec gaps found
- No field gaps. Product, Order, and OrderItem each match Section 1 exactly (six / seven /
  five fields respectively, types and defaults as documented).
- Back-relation fields (`Product.orderItems`, `Order.orderItems`) appear in `schema.prisma`
  but not in the spec tables. These are relation accessors, not database columns — Prisma
  requires them for the FK relations on OrderItem to compile. Treated as implementation
  detail, not a spec gap.

### Cascade delete verification
- Deleting a Product removes associated OrderItems: ✅ tested (productId=1 → 1 item → 0).
- Deleting an Order removes associated OrderItems: ✅ tested (order 3 → 3 items → 0).

## Follow-on flags (later milestones)

- **Milestone 1:** `.env` `DATABASE_URL` must hold real local values before any migration.
  Postgres creates the `student_store` database on the first `prisma migrate dev`.
- **Milestone 3:** `seed.js` and `data/orders.json` use the old `customer_id` (int) shape
  and lack `name`/`email`/`dormNumber`. They must be reconciled with the Order schema
  defined here when the Order model lands.
- **Milestone 6:** the provided frontend reads snake_case (`product.image_url`) and its
  `handleOnCheckout` is currently empty. Reconcile with this camelCase contract then.
