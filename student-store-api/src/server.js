const express = require("express")
const Product = require("./models/product")
const Order = require("./models/order")
const { OrderValidationError } = Order

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get("/", (req, res) => {
  res.send("Student Store API")
})

// ---- Products ----

app.get("/products", async (req, res) => {
  try {
    const { category, sort } = req.query
    const products = await Product.getAll({ category, sort })
    res.status(200).json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.getById(Number(req.params.id))
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    res.status(200).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/products", async (req, res) => {
  try {
    const { name, description, price, imageUrl, category } = req.body
    if (
      name === undefined ||
      description === undefined ||
      price === undefined ||
      imageUrl === undefined ||
      category === undefined
    ) {
      return res.status(400).json({
        error: "Missing required field: name, description, price, imageUrl, category",
      })
    }
    const product = await Product.create({ name, description, price, imageUrl, category })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await Product.getById(id)
    if (!existing) {
      return res.status(404).json({ error: "Product not found" })
    }
    const updated = await Product.update(id, req.body)
    res.status(200).json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await Product.getById(id)
    if (!existing) {
      return res.status(404).json({ error: "Product not found" })
    }
    await Product.delete(id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---- Orders ----

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.getAll()
    res.status(200).json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/orders", async (req, res) => {
  try {
    const { name, email, dormNumber, items } = req.body
    const order = await Order.create({ name, email, dormNumber, items })
    res.status(201).json(order)
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.getById(Number(req.params.id))
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }
    res.status(200).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await Order.getById(id)
    if (!existing) {
      return res.status(404).json({ error: "Order not found" })
    }
    const updated = await Order.update(id, req.body)
    res.status(200).json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await Order.getById(id)
    if (!existing) {
      return res.status(404).json({ error: "Order not found" })
    }
    await Order.delete(id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server is successfully started on ${PORT}`)
})
