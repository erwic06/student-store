const { PrismaClient } = require("@prisma/client")

// Single shared Prisma client instance — imported everywhere to avoid
// opening multiple connection pools.
const prisma = new PrismaClient()

module.exports = prisma
