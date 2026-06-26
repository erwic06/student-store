const prisma = require("../prisma")

class Customer {
  // Find a customer by (name, email) tuple, or create one. Email is treated as
  // part of the identity — two orders with the same name but different emails
  // resolve to different customers. Optional dorm_number updates the row when
  // provided so re-checkouts can refresh it.
  static async findOrCreate({ name, email, dorm_number }, tx = prisma) {
    const existing = await tx.customer.findFirst({
      where: { name, email: email ?? null },
    })
    if (existing) {
      if (dorm_number !== undefined && dorm_number !== existing.dorm_number) {
        return tx.customer.update({
          where: { id: existing.id },
          data: { dorm_number },
        })
      }
      return existing
    }
    return tx.customer.create({
      data: { name, email: email ?? null, dorm_number: dorm_number ?? null },
    })
  }
}

module.exports = Customer
