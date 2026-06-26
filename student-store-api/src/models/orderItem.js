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

  // Adds an item to an existing order and recomputes the parent's total_price.
  // Locks both ops inside one transaction so total_price never drifts.
  static async addToOrder(order_id, { product_id, quantity }) {
    if (product_id === undefined || quantity === undefined) {
      throw new OrderItemError("product_id and quantity are required", 400)
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: order_id } })
      if (!order) throw new OrderItemError("Order not found", 404)

      const product = await tx.product.findUnique({ where: { id: product_id } })
      if (!product) throw new OrderItemError("Product not found", 404)

      const item = await tx.orderItem.create({
        data: { order_id, product_id, quantity, price: product.price },
      })

      // Recompute from the source of truth — all current items × their stored prices.
      const items = await tx.orderItem.findMany({ where: { order_id } })
      const total_price = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
      await tx.order.update({ where: { id: order_id }, data: { total_price } })

      return item
    })
  }
}

module.exports = OrderItem
module.exports.OrderItemError = OrderItemError
