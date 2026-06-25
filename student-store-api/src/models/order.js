const prisma = require("../prisma")

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
      include: { orderItems: true },
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
  static async create({ name, email, dormNumber, items }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new OrderValidationError("Order must contain at least one item")
    }

    return prisma.$transaction(async (tx) => {
      const productIds = items.map((it) => it.productId)
      const products = await tx.product.findMany({ where: { id: { in: productIds } } })
      const byId = new Map(products.map((p) => [p.id, p]))

      for (const it of items) {
        if (!byId.has(it.productId)) {
          throw new OrderValidationError(`Product ${it.productId} does not exist`)
        }
      }

      const totalPrice = items.reduce(
        (sum, it) => sum + byId.get(it.productId).price * it.quantity,
        0
      )

      return tx.order.create({
        data: {
          name,
          email,
          dormNumber,
          status: "pending",
          totalPrice,
          orderItems: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              price: byId.get(it.productId).price,
            })),
          },
        },
        include: { orderItems: true },
      })
    })
  }
}

module.exports = Order
module.exports.OrderValidationError = OrderValidationError
