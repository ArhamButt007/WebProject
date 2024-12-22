import React from 'react'
import './ListProduct.css'
import { useState, useEffect } from 'react'
import remove_icon from '../../assets/cross_icon.png'
const ListProduct = () => {

  const [allproducts, setAllproducts] = useState([]);


  // Fetch all products
  const fetchInfo = async () => {
    await fetch('http://localhost:4000/allproducts').then((res) => res.json()).then((data) => {
      setAllproducts(data);
    })
  }

  // Whenever this component is mounted, fetch all products
  useEffect(() => {
    fetchInfo();
  }, []); // [] to run only once


  // Remove product
  const remove_product = async (id) => {
    await fetch('http://localhost:4000/removeproduct', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    })

    await fetchInfo();
    alert("Product removed successfully");
  }

  return (
    <div className='list-product'>
      <h1>ALL PRODUCTS LIST</h1>
      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>

      <div className="listproduct-allproducts">
        <hr />
        {allproducts.map((product, index) => {
          return <> <div className='listproduct-format-main list-product-format' key={index}>
            <img src={product.image} className='listproduct-product-icon' alt="" />
            <p>{product.name}</p>
            <p>${product.old_price}</p>
            <p>${product.new_price}</p>
            <p>{product.category}</p>
            <img onClick={() => remove_product(product.id)} className='listproduct-remove-icon' src={remove_icon} alt="" />
          </div>
          <hr />
          </>
        })}
      </div>
    </div>
  )
}

export default ListProduct
