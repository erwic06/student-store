import { formatPrice } from "../../utils/format"
import "./CheckoutSuccess.css"

const CheckoutSuccess = ({ order, setOrder, products = [] }) => {
  const handleOnClose = () => {
    setOrder(null)
  }

  const productById = new Map(products.map((p) => [p.id, p]))

  const renderReceipt = () => (
    <>
      <p className="header">Order #{order.id} — {order.name}</p>
      <ul className="purchase">
        {order.orderItems.map((item) => {
          const product = productById.get(item.productId)
          const name = product ? product.name : `Product #${item.productId}`
          return (
            <li key={item.id}>
              {name} × {item.quantity} @ {formatPrice(item.price)}
            </li>
          )
        })}
        <li><strong>Total: {formatPrice(order.totalPrice)}</strong></li>
      </ul>
    </>
  )

  return (
    <div className="CheckoutSuccess">
      <h3>
        Checkout Info{" "}
        <span className={`icon button`}>
          <i className="material-icons md-48">fact_check</i>
        </span>
      </h3>
      {order?.id ? (
        <div className="card">
          <header className="card-head">
            <h4 className="card-title">Receipt</h4>
          </header>
          <section className="card-body">{renderReceipt()}</section>
          <footer className="card-foot">
            <button className="button is-success" onClick={handleOnClose}>
              Shop More
            </button>
            <button className="button" onClick={handleOnClose}>
              Exit
            </button>
          </footer>
        </div>
      ) : (
        <div className="content">
          <p>
            A confirmation email will be sent to you so that you can confirm this order. Once you have confirmed the
            order, it will be delivered to your dorm room.
          </p>
        </div>
      )}
    </div>
  )
}

export default CheckoutSuccess
