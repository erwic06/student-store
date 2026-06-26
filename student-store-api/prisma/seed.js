const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function seed() {
  try {
    console.log('🌱 Seeding database...\n')

    // Clear existing data (children first due to FK relations) and reset autoincrement
    // sequences so reseeds produce stable IDs.
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.product.deleteMany()
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Product_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "Order_id_seq" RESTART WITH 1')
    await prisma.$executeRawUnsafe('ALTER SEQUENCE "OrderItem_id_seq" RESTART WITH 1')

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
          image_url: product.image_url,
          category: product.category,
        },
      })
    }

    // Build a customer per unique (name, email) seen in orders.json. The key
    // includes the email so two orders with the same name but different emails
    // stay distinct.
    const customerKey = (o) => `${o.name}|${o.email ?? ''}`
    const customersByKey = new Map()
    for (const order of ordersData.orders) {
      const key = customerKey(order)
      if (!customersByKey.has(key)) {
        const customer = await prisma.customer.create({
          data: {
            name: order.name,
            email: order.email ?? null,
            dorm_number: order.dorm_number ?? null,
          },
        })
        customersByKey.set(key, customer.id)
      }
    }

    // Seed orders and their items. price on each OrderItem is the purchase-time
    // price; total_price is computed from items so seed data is internally consistent.
    for (const order of ordersData.orders) {
      const total_price = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      const createdOrder = await prisma.order.create({
        data: {
          customer_id: customersByKey.get(customerKey(order)),
          total_price,
          status: order.status,
          created_at: new Date(order.created_at),
          order_items: {
            create: order.items.map((item) => ({
              product_id: item.product_id,
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
      `SELECT setval(pg_get_serial_sequence('"Customer"', 'id'), (SELECT MAX(id) FROM "Customer"))`
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
