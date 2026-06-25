Project #4: Student Store
Overview
In the Student Store project, you'll design and build the backend API and database for an online store for the College of CodePath. The provided React frontend lets customers browse products, manage a shopping cart, and place orders. Your task is to build the backend using Node and Express, set up a Prisma-managed PostgreSQL database, and connect the two.

This is the first project where you're building a multi-model system from scratch — three related data models with foreign key constraints, cascade delete rules, and a transactional endpoint that touches multiple tables at once. That complexity is exactly why you're starting with a planning.md.

Before writing any code, you'll define a system spec covering the data models, the full API contract, and the transactional flow for order creation. Every milestone that follows references that plan. By the time you deploy, the spec is a complete record of what you built and why.

🎯 Goals
By the end of this project, you will be able to:

Author a system-level planning.md covering data models, API contracts, and transactional data flow before implementation.
Design a Prisma schema with multiple related models, foreign key relationships, and cascade delete behavior.
Build a backend API that allows for CRUD operations on products and handles order processing.
Validate that your implementation matches the documented spec before connecting to the frontend.
Student Store README template

✅ Features
Required Features

Database Creation

Set up a Postgres database to store information about products and orders.
Use Prisma to define models for products, orders, and order_items.

Products Model

Develop a products model to represent individual items available in the store.
This model should at minimum include the attributes:
id
name
description
price
image_url
category
Implement methods for CRUD operations on products.
Ensure transaction handling such that when a product is deleted, any order_items that reference that product are also deleted.

Orders Model

Develop a model to manage orders.
This model should at minimum include the attributes:
order_id
customer_id
total_price
status
created_at
Implement methods for CRUD operations on orders.
Ensure transaction handling such that when an order is deleted, any order_items that reference that order are also deleted.

Order Items Model

Develop a model to represent the items within an order.
This model should at minimum include the attributes:
order_item_id
order_id
product_id
quantity
price
Implement methods for fetching and creating order items.

API Endpoints

Application supports the following Product Endpoints:
GET /products: Fetch a list of all products.
GET /products/:id: Fetch details of a specific product by its ID.
POST /products: Add a new product to the database.
PUT /products/:id: Update the details of an existing product.
DELETE /products/:id: Remove a product from the database.
Application supports the following Order Endpoints:
GET /orders: Fetch a list of all orders.
GET /orders/:order_id: Fetch details of a specific order by its ID, including the order items.
POST /orders: Create a new order with specified order items.
PUT /orders/:order_id: Update the details of an existing order (e.g., change status).
DELETE /orders/:order_id: Remove an order from the database.

Frontend Integration

Connect the backend API to the provided frontend interface, ensuring dynamic interaction for product browsing, cart management, and order placement. Adjust the frontend as necessary to work with your API.
Ensure the home page displays products contained in the product table.
Stretch Features
Added Endpoints
GET /order-items: Create an endpoint for fetching all order items in the database.
POST /orders/:order_id/items Create an endpoint that adds a new order item to an existing order.
Past Orders Page
Build a page in the UI that displays the list of all past orders.
The page lists all past orders for the user, including relevant information such as:
Order ID
Date
Total cost
Order status.
The user should be able to click on any individual order to take them to a separate page detailing the transaction.
The individual transaction page provides comprehensive information about the transaction, including:
List of order items
Order item quantities
Individual order item costs
Total order cost
Filter Orders.
Create an input on the Past Orders page of the frontend application that allows the user to filter orders by the email of the person who placed the order.
Users can type in an email and click a button to filter the orders.
Upon entering an email address adn submitting the input, the list of orders is filtered to only show orders placed by the user with the provided email.
The user can easily navigate back to the full list of ordres after filtering.
Proper error handling is implemented, such as displaying "no orders found" when an invalid email is provided.
Deployment
Website is deployed using Render.
A simple version of the app with all the required features implemented:


🧑🏽‍💻 Project Instructions
Milestone 0: Project Setup
Goal
Fork and set up the project, then write a planning.md that defines the system before any implementation begins.

Walkthrough
Fork the starter repository and clone it to your local machine.
Open the project in Cursor: cursor .
Explore the Project Files
You've been provided with some helpful resources to get started:

/student-store-api — starter files for your backend implementation. This is where you'll work for the majority of the project.
/student-store-ui — a fully implemented frontend. You'll connect your backend to this in Milestone 6.
Setup Requirements
Install Dependencies:
Run npm install in the /student-store-api directory.
Set Up Express Server:
Inside server.js, import Express, initialize the app, set up a root route, and listen on a port.
Test the Server:
Start the server and confirm the root route responds in a browser or Postman.
Writing Your System Spec
Before writing any model code or route handlers, create a planning.md file in the /student-store-api directory and write your system spec. This document will serve as the source of truth for all three milestones that involve schema and route decisions.

Your planning.md should cover three sections:

Section 1: Data Models

Define each of the three models — Product, Order, and OrderItem — before you touch schema.prisma. For each model, document:

Every field: name, Prisma data type, required or optional, any default value
The primary key field and whether it auto-increments
Relationships to other models (foreign keys)
Cascade behavior: what happens when a parent record is deleted?
The cascade rules are the most important part of this section. The required features specify two constraints:

Deleting a Product should also delete any OrderItem records referencing it
Deleting an Order should also delete any OrderItem records referencing it
These are cascade delete rules. Document them in plain language before you implement them in Prisma — this forces you to think through the dependency chain before the schema enforces it.

💡 OrderItem sits at the intersection of two relationships
Section 2: API Contract

Define every required endpoint before implementing any routes. For each endpoint, document:

HTTP method and path
Request shape (body fields for POST/PUT, route params, query params)
Success response: status code and body shape
At least one error case: status code and error body shape
Pay special attention to POST /orders — this endpoint is more complex than a standard create. The request body includes both the order metadata (customer info, status) and an array of order items to create. The response should include the created order along with its associated items. Document both sides of this contract clearly.

Also define a consistent error response shape for the entire API (e.g., { "error": "message" }) and note it at the top of the section.

Section 3: Transactional Flow

POST /orders is the most architecturally significant endpoint in this project. It has to:

Create an Order record
Create multiple OrderItem records, each linked to the new order
Calculate and store the total price
Do all of this atomically — if creating any order item fails, the entire operation should roll back
Before implementing this, write a step-by-step description of what happens at the data layer when POST /orders is called. What does the request body look like? What Prisma operations run? In what order? What's the response if one of the items references a nonexistent product?

This is a preview of the transaction patterns you'll encounter throughout the rest of the course. Writing it down before implementing it is the difference between a clear mental model and debugging a half-created order at 11pm.

💡 Use Claude to pressure-test your plan, not to write it
📍 Checkpoint
The package.json file exists with the project's metadata and dependencies.
Express server is set up and responds to a test route.
The server can be started using node or nodemon and is accessible via Postman.
Express server is set up and responds to a test route.
planning.md exists in /student-store-api with all three sections: Data Models (including cascade rules), API Contract (all required endpoints with request/response shapes and error cases), and Transactional Flow for POST /orders.
The spec is committed to version control.
Milestone 1: Product Model
Goal
Translate the Product data model from your planning.md into a Prisma schema, run the migration, and implement CRUD routes.

Requirements
Formalize the Data Model:
Open your planning.md Data Models section and find the Product model definition.
Open prisma/schema.prisma. Translate each field from your spec into Prisma syntax: field name, type, and any modifiers (@id, @default(autoincrement()), ? for optional fields).
Run a migration with a descriptive name (e.g., init_products_table).
Implement Product Logic:
Create a Product class in models/product.js.
Define methods for each CRUD operation using Prisma Client.
Implement API Endpoints:
Set up routes in server.js for all five product endpoints from your API contract.
Before writing each route handler, check the corresponding entry in planning.md — the request shape and response shape are already defined.
Test Endpoints:
Use Postman to test each endpoint. For each test, verify the response status and body match what your planning.md specifies.
💡 Schema before migration, always
Decisions Log: Product Model
After implementing and testing all five product endpoints, add to the Decisions Log section of your planning.md:

## Decisions Log — Product Model

- **Schema translation that went smoothly**: [e.g., "`price` as Float — Prisma's Float maps cleanly to PostgreSQL DECIMAL for currency"]

- **Field decision I made during implementation that wasn't in the original spec**: [e.g., "Added `@updatedAt` to track when products were last modified — useful for the frontend cache"]

- **Route behavior that needed a spec update**: [e.g., "Spec said `PUT /products/:id` returns 200 with the updated product — confirmed and tested; no spec change needed"]
Add 2–3 entries to the Decisions Log.
📍Checkpoint
The Product model in schema.prisma matches the Data Models section of planning.md.
The migration has run and the products table exists in the database.
All five product endpoints are implemented and tested in Postman. Each response matches the API contract in planning.md.
Milestone 2: Using Query Params
Goal
Extend the GET /products endpoint to support filtering and sorting via query parameters.

Requirements
Update Your API Contract:
Before touching any code, open planning.md and update the GET /products entry to add a Query Parameters subsection. Document at minimum: category filtering (e.g., ?category=clothing) and sort ordering (e.g., ?sort=price or ?sort=name). Include the default behavior when no parameters are provided (return all products, unordered).
Modify GET /products Endpoint:
Update the route to read from req.query and apply the documented filters dynamically using Prisma's where and orderBy options.
Test Updated Endpoint:
Use Postman to test the endpoint with various combinations: no parameters, category only, sort only, both together, and an invalid category value.
Confirm each response matches the updated spec.
📍Checkpoint
The GET /products query parameter surface is documented in planning.md before implementation.
Filtering and sorting work correctly and match the documented behavior.
Milestone 3: Order Model
Goal
Translate the Order data model from your planning.md into a Prisma schema, run the migration, and implement CRUD routes.

Requirements
Formalize the Data Model:
Open the Order model definition in your planning.md.
Add the Order model to schema.prisma. Translate each field from your spec — pay particular attention to the status field's type (a String is fine for now) and createdAt (Prisma can auto-populate this with @default(now())).
Run a migration with a descriptive name (e.g., add_orders_table).
Implement Order Logic:
Create an Order class in models/order.js.
Define methods for creating, fetching, updating, and deleting orders.
Implement Order API Endpoints:
Set up routes in server.js for CRUD operations on orders. Reference your API contract for each route's expected request and response shapes.
Test Order Endpoints:
Test each endpoint in Postman. Verify status codes and response shapes match planning.md.
📍 Checkpoint
The Order model in schema.prisma matches the Data Models section of planning.md.
The migration has run and the orders table exists in the database.
All order CRUD endpoints are implemented and tested. Each response matches the API contract.
Milestone 4: OrderItem Model and Relationships
Goal
Add the OrderItem model, establish its relationships to Order and Product, and implement cascade delete behavior as specified in your planning.md.

Requirements
Formalize the Data Model and Relationships:
Open the OrderItem model definition and cascade rules in your planning.md.
Add the OrderItem model to schema.prisma. Use Prisma's @relation annotation to connect it to both Order and Product.
Set up cascade delete on both relationships using onDelete: Cascade — so that deleting an Order or a Product automatically removes the associated OrderItem records.
Run a migration with a descriptive name (e.g., add_order_items_with_relations).
Implement OrderItem Logic:
Create an OrderItem class in models/orderItem.js.
Define methods for creating and fetching order items.
Update Order Model:
Update the Order class to include a method that fetches an order along with its associated order items (using Prisma's include option).
Test Relationships:
Use Postman to create an order with order items, then fetch the order and confirm the items are included in the response.
Test cascade delete: delete a product that appears in an order item and verify the order item is removed.
Spec Reconciliation: Schema Audit
Before running your migration, pause and verify that schema.prisma matches your planning.md Data Models section.

Open the Chat panel in Cursor (Ask mode). Share both files using @planning.md and @schema.prisma. Ask Claude:

"Does this Prisma schema match the data model spec in planning.md? Are the relationships between Product, Order, and OrderItem modeled correctly? Are the cascade delete rules implemented as documented? Are there any fields in the schema that don't appear in the spec, or fields in the spec that are missing from the schema?"

Address any gaps Claude surfaces before running the migration — it's easier to fix the schema file than to correct a migration after it runs.

After the migration succeeds and you've verified the relationships work, document what you found in a Spec Reconciliation — Milestone 4 section of your planning.md:

## Spec Reconciliation — Milestone 4 (Schema Audit)

### Schema vs. spec gaps found
- [e.g., "Spec said OrderItem.price was 'the price at time of purchase' — added this note to the schema comment but the field type was correct"]
- [e.g., "No gaps found — schema matched spec exactly"]

### Cascade delete verification
- Deleting a Product removes associated OrderItems: ✅ tested
- Deleting an Order removes associated OrderItems: ✅ tested
📍 Checkpoint
schema.prisma matches the Data Models section of planning.md, including relationships and cascade delete rules — confirmed by the schema audit.
The migration has run and the order_items table exists with the correct foreign key columns.
Fetching an order by ID returns the order along with its associated items.
Cascade delete works as specified: deleting an Order or Product removes the associated OrderItem records.
Milestone 5: Order Creation Endpoint
Goal
Implement POST /orders as a transactional operation that creates an order and its items atomically, as specified in the Transactional Flow section of your planning.md.

Requirements
Review Your Transactional Flow Spec:
Open the Transactional Flow section of planning.md. This is your implementation guide for this entire milestone. The request body shape, the sequence of Prisma operations, the total price calculation, and the error cases should all be documented there.
If anything is missing or unclear, update the spec before writing any code.
Implement the Endpoint:
POST /orders should accept a request body containing both order metadata and an array of items. It should:
Create the Order record
Create each OrderItem record, linking it to the new order
Calculate and store the total price
Return the created order with all its items included
Use Prisma's $transaction API to ensure atomicity — if any step fails, the entire operation rolls back.
Implement Error Handling:
Handle the case where a productId in the items array doesn't exist in the database.
Return the error shape documented in your API contract.
Test the Endpoint:
Use Postman to test the success case: a valid order with multiple items. Verify the response includes the order and all its items.
Test the failure case: include a productId that doesn't exist. Verify the error response matches the spec and no partial order is created.
💡 Prisma transactions
Decisions Log: Order Creation Transaction
POST /orders is the most architecturally complex endpoint in this project. After implementing it, record what the process revealed. Add to the Decisions Log in your planning.md:

## Decisions Log — Order Creation Transaction

- **What my Transactional Flow spec got right**: [e.g., "The step-by-step order of operations was accurate — create Order, then loop to create OrderItems, then update total_price"]

- **What the spec missed that I discovered during implementation**: [e.g., "Spec didn't address what happens if the items array is empty — added a 400 validation check and updated spec"]

- **How the transaction error handling works**: [explain in your own words what `prisma.$transaction` does when one operation fails]

- **One thing I'd design differently if starting over**: [honest reflection — no wrong answer]
Add entries to the Decisions Log.
📍 Checkpoint
POST /orders creates an order and all its items atomically.
The response includes the order and its associated items, matching the API contract in planning.md.
A failed transaction (e.g., invalid productId) returns the correct error response and creates no partial records.
Milestone 6: Connect to Frontend
Goal
Audit the frontend's API expectations against your planning.md contract, resolve any mismatches, then connect and test the full system.

Requirements
Frontend Requirements Audit:
Before enabling anything, open the frontend code in /student-store-ui and find every fetch() call. For each one, note: the route it targets, the request body shape it sends, and the response fields it reads.
Cross-reference each fetch call against your planning.md API Contract. For any mismatch — a field name that differs, a route path that doesn't match, a response shape the frontend expects but your spec doesn't define — decide how to resolve it before connecting the two systems.
Enable CORS:
Install and enable the cors middleware in server.js.
Connect and Test:
Start both the backend and the frontend development server.
Test the complete flow: browse products, add items to the cart, and place an order. Verify that data flows correctly through the full system.
Final Spec Reconciliation — Full System Audit
With the frontend connected, run a final reconciliation across the entire system. This is the capstone of the spec-first workflow you've practiced all week — you wrote the spec before any implementation, and now you're verifying that the full system matches the promise you made.

Open the Chat panel in Cursor (Ask mode). Share @planning.md and @server.js. Ask Claude:

"Walk through one complete user flow — a customer placing an order. Does the POST /orders request match the spec? Does the response include everything the frontend needs? Are there any states (empty cart, failed order, product not found) that the spec defines but the implementation doesn't handle? Is there anything the implementation does that the spec doesn't document?"

Document the result in a Final Spec Reconciliation section of your planning.md:

## Final Spec Reconciliation: Project Complete

### Full-system audit result
- [e.g., "All 12 endpoints match the API contract"]
- [e.g., "Found: spec didn't document CORS configuration — added implementation note to planning.md"]

### Gaps resolved during frontend integration
- [e.g., "Frontend sends `customerId` as a string; spec and backend expected integer — added parseInt() and updated spec note"]
- [e.g., "No gaps — frontend expectations matched the API contract exactly"]

### What the spec enabled during this project
- [1–2 sentences: what was easier to build or debug because you had a written spec?]
📍 Checkpoint
Frontend requirements audit is complete. Any mismatches between the frontend's expectations and the API contract are resolved.
The frontend is connected and the complete product browsing, cart management, and order placement flow works end-to-end.
The final spec reconciliation is documented in planning.md.
🎉 Stretch Features
Great work building your first multi-model API independently! Before tackling any stretch feature, update your planning.md first — add the new endpoint to the API Contract, add any new fields to the Data Models section, and update the Transactional Flow if the feature touches POST /orders. This is how the spec stays accurate as the system grows.

Added Endpoints
Create an endpoint for fetching all orders in the database.
Create an endpoint for serving an individual order based on its ID.
Filter Orders
Allow users to use an input to filter orders by the email of the person who placed the order.
Implement Your Own Frontend
Build your own user interface for browsing products, managing the shopping cart, and placing orders. This will involve integrating the frontend you create with the backend API you developed during the project.
Past Orders Page
Build a page in the UI that displays the list of all past orders. The user should be able to click on any individual order to take them to a more detailed page of the transaction.