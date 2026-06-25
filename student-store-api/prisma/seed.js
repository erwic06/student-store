const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function seed() {
  try {
    console.log('🌱 Seeding database...\n')

    // Clear existing data (children first due to FK relations)
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()

    // Load JSON data
    const productsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8')
    )

    const ordersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/orders.json'), 'utf8')
    )

    // Seed products with explicit ids so order items can reference them reliably.
    for (const product of productsData.products) {
      await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.image_url,
          category: product.category,
        },
      })
    }

    // Seed orders and their items (camelCase Order shape; price = purchase-time price).
    for (const order of ordersData.orders) {
      const createdOrder = await prisma.order.create({
        data: {
          name: order.name,
          email: order.email,
          dormNumber: order.dormNumber,
          totalPrice: order.total_price,
          status: order.status,
          createdAt: new Date(order.created_at),
          orderItems: {
            create: order.items.map((item) => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      console.log(`✅ Created order #${createdOrder.id}`)
    }

    // Re-align autoincrement sequences past the explicit ids we inserted, so
    // app-created records (POST) get the next free id instead of colliding.
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), (SELECT MAX(id) FROM "Product"))`
    )
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Order"', 'id'), (SELECT MAX(id) FROM "Order"))`
    )
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"OrderItem"', 'id'), (SELECT MAX(id) FROM "OrderItem"))`
    )

    console.log('\n🎉 Seeding complete!')
  } catch (err) {
    console.error('❌ Error seeding:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

seed()
