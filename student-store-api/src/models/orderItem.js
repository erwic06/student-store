const prisma = require("../prisma")

class OrderItem {
  static async getAll() {
    return prisma.orderItem.findMany()
  }

  static async getById(id) {
    return prisma.orderItem.findUnique({ where: { id } })
  }

  static async create(data) {
    return prisma.orderItem.create({ data })
  }
}

module.exports = OrderItem
