const prisma = require("../prisma")

class Product {
  static async getAll({ category, sort } = {}) {
    // Build where/orderBy dynamically; unknown or empty params fall back to defaults.
    const where = {}
    if (category) {
      where.category = category
    }

    const orderBy = {}
    if (sort === "price" || sort === "name") {
      orderBy[sort] = "asc"
    }

    return prisma.product.findMany({
      where,
      ...(Object.keys(orderBy).length ? { orderBy } : {}),
    })
  }

  static async getById(id) {
    return prisma.product.findUnique({ where: { id } })
  }

  static async create(data) {
    return prisma.product.create({ data })
  }

  static async update(id, data) {
    return prisma.product.update({ where: { id }, data })
  }

  static async delete(id) {
    return prisma.product.delete({ where: { id } })
  }
}

module.exports = Product
