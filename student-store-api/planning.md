# Student Store API — System Spec

> Source of truth for all schema and route decisions. Fill each section before
> writing `schema.prisma`, models, or route handlers.

> **Naming convention:** all Prisma model **fields** and JSON **keys** are
> **snake_case** to match the README spec (`image_url`, `customer_id`,
> `total_price`, `created_at`, `order_id`, `product_id`). Primary keys stay as
> `id` (universal Postgres/Prisma idiom; the README's `order_id`/`product_id`/
> `order_item_id` are interpreted as "the id attribute" of each table). Postgres
> table names stay PascalCase (Prisma default) — the spec is about JSON shape
> and Prisma model fields, not physical table names.

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
| image_url | String | yes | — | Matches README spec exactly |
| category | String | yes | — | e.g. Apparel, Books, Supplies, Snacks, Accessories |

- **Primary key:** `id`, auto-increments.
- **Relationships:** one Product → many OrderItem (back-relation `order_items`).
- **Cascade behavior:** deleting a Product deletes all OrderItems referencing it.

### Customer

> Added to make `Order.customer_id` a real FK (the README spec requires
> `customer_id`). The checkout form still collects only `name` + `dorm_number`;
> the order route does a find-or-create by `(name, email)` so the customer row
> is created lazily.

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key |
| name | String | yes | — | From the checkout form |
| email | String? | no | — | Optional (email-filter stretch dropped) |
| dorm_number | String? | no | — | Optional, collected by the frontend |

- **Primary key:** `id`, auto-increments.
- **Relationships:** one Customer → many Order.
- **Cascade behavior:** `onDelete: Restrict` on the Order→Customer relation —
  customers can't be deleted while they still have order history.

### Order

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key |
| customer_id | Int | yes (FK) | — | → Customer.id |
| total_price | Float | yes | — | Computed server-side during order creation |
| status | String | yes | `@default("pending")` | String is fine per guide |
| created_at | DateTime | yes | `@default(now())` | Auto-populated |

- **Primary key:** `id`, auto-increments.
- **Relationships:** one Order → many OrderItem (back-relation `order_items`);
  one Order → one Customer (`customer`).
- **Cascade behavior:** deleting an Order deletes all OrderItems referencing it;
  deleting the linked Customer is blocked (`onDelete: Restrict`).

### OrderItem

> Sits at the intersection of two relationships (Product and Order).

| Field | Prisma type | Required? | Default | Notes |
|-------|-------------|-----------|---------|-------|
| id | Int | yes (PK) | `@default(autoincrement())` | Primary key (`order_item_id` in README) |
| order_id | Int | yes (FK) | — | → Order.id |
| product_id | Int | yes (FK) | — | → Product.id |
| quantity | Int | yes | — | |
| price | Float | yes | — | Price **at time of purchase** (copied from Product.price) |

- **Primary key:** `id`, auto-increments.
- **Relationships (foreign keys):** `order_id` → Order, `product_id` → Product.
  Both use `@relation(..., onDelete: Cascade)`.
- **Cascade behavior:** an OrderItem is removed automatically when its parent
  Order or Product is deleted.

### Cascade Delete Rules (plain language)

> Document the dependency chain before the schema enforces it.

1. Deleting a **Product** → every OrderItem with that `product_id` is also deleted.
2. Deleting an **Order** → every OrderItem with that `order_id` is also deleted.
3. Deleting a **Customer** is restricted while any Order still references it.

OrderItem is the child of both Order and Product; the cascade lives on the two
FK relations defined in OrderItem.

---

## Section 2: API Contract

**Standard error response shape:** `{ "error": "message" }`

> For each endpoint: HTTP method + path, request shape (body / route params /
> query params), success status + body shape, and at least one error case
> (status + error body). All JSON keys are snake_case.

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
- **Request body:** `{ name, description, price, image_url, category }`.
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
- **Request:** none. (The `?email=` filter stretch was dropped; `email` lives on Customer and is optional.)
- **Success:** `200` → `[ Order, ... ]`.
- **Error:** `500` → `{ "error": "..." }`.

#### GET /orders/:id
- **Request:** route param `id`.
- **Success:** `200` → `Order` **with nested `order_items` array and `customer` object**.
- **Error:** `404` → `{ "error": "Order not found" }`.

#### POST /orders
> More complex than a standard create. Body includes customer info (used to
> find-or-create the Customer row) **and** an array of order items. Response
> includes the created order **with** its associated items and customer.

- **Request body:**
  - Customer info: `name`, `email`, `dorm_number`.
  - `items[]`: array of `{ product_id, quantity }`.

  ```json
  {
    "name": "Ada Lovelace",
    "email": "ada@college.edu",
    "dorm_number": "B12",
    "items": [ { "product_id": 1, "quantity": 2 }, { "product_id": 4, "quantity": 1 } ]
  }
  ```
- **Success:** `201` → the created `Order` with its `order_items` nested,
  `customer` nested, and `total_price` computed server-side.
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
> Add a single item to an existing order. The parent order's `total_price` is
> recomputed and persisted in the same transaction.

- **Request:** route param `orderId`; body `{ product_id, quantity }`.
- **Success:** `201` → the created `OrderItem`.
- **Error:**
  - `404` → `{ "error": "Order not found" }`.
  - `404` → `{ "error": "Product not found" }`.
  - `400` → `{ "error": "product_id and quantity are required" }`.

---

## Section 3: Transactional Flow — POST /orders

> Step-by-step description of what happens at the data layer. Must be atomic:
> if creating any order item fails, the whole operation rolls back.

### Request body shape

```json
{
  "name": "Ada Lovelace",
  "email": "ada@college.edu",
  "dorm_number": "B12",
  "items": [ { "product_id": 1, "quantity": 2 }, { "product_id": 4, "quantity": 1 } ]
}
```

### Steps (in order)

All steps below run inside one `prisma.$transaction`.

1. Validate that `items` is a non-empty array. If not → respond
   `400 { "error": "Order must contain at least one item" }`.
2. **Find-or-create Customer** by `(name, email)`. If a matching row exists,
   refresh its `dorm_number` when the request supplies a different value;
   otherwise insert a new Customer. Capture the customer's `id`.
3. Look up every `product_id` in `items` (`findMany` on the set of ids). If any
   id is missing → throw → transaction rolls back → respond
   `400 { "error": "Product <id> does not exist" }`.
4. Compute each line price from the looked-up `Product.price` (× `quantity`) and
   sum them into `total_price` (server-side; never trust a client-sent total).
5. Create the `Order` row (`customer_id`, `status: "pending"`, `total_price`).
6. Create the `OrderItem` rows linked via `order_id`, each storing `price` = the
   product price at purchase time.
7. Return the order with `order_items` and `customer` included.

### Total price calculation

> When and how is the total computed and stored?

Computed in step 4 from authoritative DB prices (not from any client-supplied
value), then stored on the Order in step 5.

### Atomicity

> Which Prisma operations run inside the transaction? What guarantees rollback?

Steps 2–6 (customer find-or-create, product lookup, Order create, OrderItem
creates) all run inside `prisma.$transaction`. Any throw — e.g. a nonexistent
product — aborts the whole transaction, so no partial Customer/Order/OrderItem
rows persist.

### Failure case: item references a nonexistent product

> What happens? What is the response status and body? What state is the
> database left in?

The product lookup in step 3 throws, the transaction rolls back, the database is
left unchanged (including any customer row the transaction would have inserted),
and the response is `400 { "error": "Product <id> does not exist" }`.

---

## Reconciliation: snake_case + Customer table

This section records the schema/contract reconciliation done as part of
submission prep. Earlier milestones used camelCase Prisma fields with snake_case
JSON in seed files; both sides are now snake_case end-to-end.

### What changed
- **Prisma fields** renamed: `imageUrl → image_url`, `totalPrice → total_price`,
  `createdAt → created_at`, `orderId → order_id`, `productId → product_id`,
  `dormNumber → dorm_number`. Back-relations renamed: `orderItems → order_items`.
  Primary keys stay `id` (universal Postgres idiom; README's `order_id`/`product_id`/
  `order_item_id` are interpreted as "the id attribute" of each table).
- **Customer model added** with `id`, `name`, `email?`, `dorm_number?`. `Order.customer_id`
  is now a real FK with `onDelete: Restrict`. The `name`/`email`/`dorm_number`
  columns moved off of Order onto Customer.
- **POST /orders** does a find-or-create on Customer as its first transactional
  step. The wire body still accepts `{ name, email, dorm_number, items }` so the
  frontend form is unchanged.
- **Wire format** is fully snake_case end-to-end: seed JSON, route bodies,
  response shapes, and frontend reads.

### Why
- The README explicitly lists snake_case attributes (`image_url`, `total_price`,
  `customer_id`, `created_at`). Prisma Studio shows the model field names, so
  `@map(...)` alone wouldn't make the display match the spec — only renaming the
  field does.
- The README requires `customer_id` on Order. Earlier milestones used a
  denormalized inline `name`/`email`/`dormNumber` on Order; making Customer a
  real table is the correct fix, not a placeholder int column.

### What did **not** change
- Postgres physical table names are still PascalCase (`Product`, `Order`,
  `OrderItem`, `Customer`) — Prisma's default. The spec is about JSON shape and
  Prisma field names, not physical table names.
- Cascade behavior on OrderItem is identical (Product/Order parent delete →
  cascade).
- The `total_price` recomputation in `POST /orders/:orderId/items` is unchanged
  in logic, only renamed.

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

## Final Spec Reconciliation: Project Complete

### Full-system audit result
- All required endpoints (5 product, 5 order) match the API contract: status codes, body
  shapes, error shapes (`{ error }`), and DELETE returning `204` no-body.
- Stretch endpoints (`GET /order-items`, `POST /orders/:orderId/items`) match the contract
  added to Section 2.
- `POST /orders` follows Section 3 step-for-step (validate → customer find-or-create →
  product lookup → server-side total_price → Order create → OrderItems create → return
  with items + customer), all inside one `prisma.$transaction`. Failure cases verified
  leave the orders count unchanged.
- Cascade rules from Section 1 verified end-to-end: deleting a Product removes its
  OrderItems; deleting an Order removes its OrderItems.

### Gaps resolved during frontend integration
- **Frontend used snake_case `image_url`** and the API contract is now snake_case too —
  the previous camelCase reconcile is moot; everything reads `image_url` end-to-end.
- **`CheckoutSuccess.jsx` expected `order.purchase.receipt.lines`** which the API never
  produces. Rewrote it to render directly from the `Order` shape the API returns
  (`id`, `name`, `total_price`, `order_items[]`). The spec stays the source of truth.
- **`PaymentInfo.jsx` field-mapping bug:** its second input bound `value=userInfo.id` but
  wrote `email`. Per the email-optional decision and the form having only two inputs, mapped
  the second field to `dorm_number`.
- **`handleOnCheckout` was empty.** Implemented it to POST `{ name, dorm_number, items }` to
  `/orders`, transforming `cart` (`{ product_id: quantity }`) into the API's
  `[{ product_id, quantity }]`. `email` is omitted (optional per the M3 spec change).
- **`ProductDetail` had no fetch.** Added a `useEffect` calling `GET /products/:productId`.
- **`App.jsx` had no products fetch.** Added an `useEffect` calling `GET /products` on mount.
- **API base URL** consolidated to `API_BASE_URL` exported from `App.jsx`, defaulting to
  `http://localhost:3000` but overridable via `VITE_API_BASE_URL` for deployment.
- **CORS** was missing from the backend; added `cors()` middleware. Documented here as an
  implementation note that the spec didn't call out.
- **Hard-coded port** in `server.js` was already changed to `process.env.PORT || 3000` during
  M1, in preparation for Render.

### Verification
- Curl-driven smoke against the live stack (backend on 3000, vite on 5173) passed for
  `GET /products`, `GET /products/:id`, and `POST /orders` (request from `Origin:
  http://localhost:5173` accepted by CORS, response is 201 with computed total_price and
  nested `order_items` + `customer`).
- `vite build` succeeds — no JSX/import errors.
- Browser-driven click-through manual verification step: open `http://localhost:5173`,
  browse products, add to cart, enter name + dorm number, submit, expect a receipt with
  order id + items + total.

### What the spec enabled during this project
- Section 1 (data models) drove the migrations 1:1 and made the M4 schema audit
  straightforward — every field already had a documented type and required/optional flag.
- Section 3 (Transactional Flow) collapsed M5 to a transcription job: the numbered
  steps became lines of code inside one `$transaction`.
- The `{ "error": "message" }` error contract made route handlers boilerplate; every
  endpoint already knew what shape to return for which failure case.

## Decisions Log — Order Creation Transaction

- **What the Transactional Flow spec got right:** the step ordering (validate → customer
  find-or-create → lookup products → compute total → create Order → create OrderItems →
  return with items + customer) translated to code 1:1. Doing it all inside one
  `prisma.$transaction(async tx => …)` and using nested `order_items.create` keeps it to a
  single transactional Order create call.
- **What the spec missed (and is now fixed in code):** the spec mentioned an empty-`items`
  guard inline (step 1) but didn't separate it from "client fault" vs "server fault" errors.
  Introduced `OrderValidationError` so the route can map *only* those throws to `400` and any
  other failure stays `500`. Empty items, missing product → 400; DB outage → 500.
- **How the transaction error handling works:** `prisma.$transaction` runs all queries on a
  single connection inside a real Postgres `BEGIN`/`COMMIT`. Any throw inside the callback
  causes `ROLLBACK` — the Order row, any half-written OrderItem rows, and a freshly created
  Customer row are all discarded. That is why a bad `product_id` leaves the orders count
  unchanged.
- **One thing I would design differently:** the model layer currently knows about HTTP-shaped
  validation messages (`"Product 99 does not exist"`). For a larger system I would have it
  throw a structured `{ code: "PRODUCT_NOT_FOUND", product_id }` and let the route format the
  message. Acceptable here because the spec dictates the exact wire string.

## Spec Reconciliation — Milestone 4 (Schema Audit)

### Schema vs. spec gaps found
- No field gaps. Product, Order, OrderItem, and Customer each match Section 1 exactly.
- Back-relation fields (`Product.order_items`, `Order.order_items`, `Customer.orders`)
  appear in `schema.prisma` but not in the spec tables. These are relation accessors,
  not database columns — Prisma requires them for the FK relations to compile. Treated
  as implementation detail, not a spec gap.

### Cascade delete verification
- Deleting a Product removes associated OrderItems: ✅ tested (product_id=1 → 1 item → 0).
- Deleting an Order removes associated OrderItems: ✅ tested (order 3 → 3 items → 0).

## Follow-on flags (later milestones)

- **Milestone 1:** `.env` `DATABASE_URL` must hold real local values before any migration.
  Postgres creates the `student_store` database on the first `prisma migrate dev`.
- **Milestone 3:** `seed.js` and `data/orders.json` are now fully snake_case and seed a
  Customer per unique `(name, email)` in the orders fixture.
- **Milestone 6:** the frontend wire format is snake_case end-to-end; checkout POSTs
  `{ name, dorm_number, items: [{ product_id, quantity }] }` and reads `order.order_items`,
  `order.total_price`, `product.image_url` in the receipt.
