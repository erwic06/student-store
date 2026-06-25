const prisma = require("../prisma")

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
}

module.exports = Order
