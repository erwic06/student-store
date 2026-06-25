const prisma = require("../prisma")

class OrderItemError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "OrderItemError"
    this.status = status
  }
}

class OrderItem {
  static async getAll() {
    return prisma.orderItem.findMany()
  }

  static async getById(id) {
    return prisma.orderItem.findUnique({ where: { id } })
  }

  // Adds an item to an existing order and recomputes the parent's totalPrice.
  // Locks both ops inside one transaction so totalPrice never drifts.
  static async addToOrder(orderId, { productId, quantity }) {
    if (productId === undefined || quantity === undefined) {
      throw new OrderItemError("productId and quantity are required", 400)
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order) throw new OrderItemError("Order not found", 404)

      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new OrderItemError("Product not found", 404)

      const item = await tx.orderItem.create({
        data: { orderId, productId, quantity, price: product.price },
      })

      // Recompute from the source of truth — all current items × their stored prices.
      const items = await tx.orderItem.findMany({ where: { orderId } })
      const totalPrice = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
      await tx.order.update({ where: { id: orderId }, data: { totalPrice } })

      return item
    })
  }
}

module.exports = OrderItem
module.exports.OrderItemError = OrderItemError
