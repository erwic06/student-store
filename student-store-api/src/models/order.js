const prisma = require("../prisma")
const Customer = require("./customer")

// Thrown inside Order.create to signal a 400-class failure. The route handler
// catches this specifically and forwards the message; anything else is 500.
class OrderValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = "OrderValidationError"
  }
}

class Order {
  static async getAll() {
    return prisma.order.findMany()
  }

  static async getById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: { order_items: true, customer: true },
    })
  }

  static async update(id, data) {
    return prisma.order.update({ where: { id }, data })
  }

  static async delete(id) {
    return prisma.order.delete({ where: { id } })
  }

  // Section 3 of planning.md — atomic create of an Order plus its OrderItems.
  // Throws OrderValidationError for client-fault failures (empty items, missing product).
  static async create({ name, email, dorm_number, items }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new OrderValidationError("Order must contain at least one item")
    }

    return prisma.$transaction(async (tx) => {
      const customer = await Customer.findOrCreate({ name, email, dorm_number }, tx)

      const productIds = items.map((it) => it.product_id)
      const products = await tx.product.findMany({ where: { id: { in: productIds } } })
      const byId = new Map(products.map((p) => [p.id, p]))

      for (const it of items) {
        if (!byId.has(it.product_id)) {
          throw new OrderValidationError(`Product ${it.product_id} does not exist`)
        }
      }

      const total_price = items.reduce(
        (sum, it) => sum + byId.get(it.product_id).price * it.quantity,
        0
      )

      return tx.order.create({
        data: {
          customer_id: customer.id,
          status: "pending",
          total_price,
          order_items: {
            create: items.map((it) => ({
              product_id: it.product_id,
              quantity: it.quantity,
              price: byId.get(it.product_id).price,
            })),
          },
        },
        include: { order_items: true, customer: true },
      })
    })
  }
}

module.exports = Order
module.exports.OrderValidationError = OrderValidationError
