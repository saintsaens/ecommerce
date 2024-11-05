import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setQuantity, fetchItems, setRarityFilter, setTypeFilter, clearSelection } from '../store/features/itemsSlice';
import { addItems, addToCart } from "../store/features/cartSlice";
import { parseMoney, formatCurrency } from "../utils/money";
import CartWidget from "./CartWidget";

function Items() {
  const dispatch = useDispatch();
  const { items, rarityFilter, typeFilter } = useSelector((state) => state.items);
  const { userId } = useSelector((state) => state.user.userId);
  const { username } = useSelector((state) => state.user.username);

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  const handleRarityChange = (event) => {
    dispatch(setRarityFilter(event.target.value));
  };

  const handleTypeChange = (event) => {
    dispatch(setTypeFilter(event.target.value));
  };

  const handleQuantityChange = (itemId, quantity) => {
    dispatch(setQuantity({ itemId, quantity }));
  };


  const filteredItems = items.filter(item =>
    (rarityFilter === 'All' || item.rarity === rarityFilter) &&
    (typeFilter === 'All' || item.type === typeFilter)
  );

  const totalPrice = filteredItems.reduce((acc, item) => {
    const itemPrice = parseMoney(item.price);
    const itemQuantity = Number(item.quantity) || 0;
    return acc + itemPrice * itemQuantity;
  }, 0);

  return (
    <>
      {username && <CartWidget />}
      <section>
        <label htmlFor="rarity-filter">Filter by rarity: </label>
        <select id="rarity-filter" value={rarityFilter} onChange={handleRarityChange}>
          <option value="All">All</option>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Legendary">Legendary</option>
        </select>

        <label htmlFor="type-filter">Filter by type: </label>
        <select id="type-filter" value={typeFilter} onChange={handleTypeChange}>
          <option value="All">All</option>
          <option value="Weapon">Weapon</option>
          <option value="Potion">Potion</option>
        </select>
      </section>

      <section>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Rarity</th>
              <th>Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(({ id, name, type, rarity, price, quantity = 0 }) => (
              <tr key={id}>
                <td>{name}</td>
                <td>{type}</td>
                <td>{rarity}</td>
                <td>{price}</td>
                <td>
                  <select
                    value={quantity}
                    onChange={(e) => handleQuantityChange(id, Number(e.target.value))}
                  >
                    {[...Array(10).keys()].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <p>Total price: {formatCurrency(totalPrice)}</p>
      </section>

      <section>
        <button
          onClick={() => {
            dispatch(addItems({ items, totalPrice }));
            dispatch(addToCart({ userId, items }));
            dispatch(clearSelection());
          }}
        >
          Add to cart
        </button>
      </section>
    </>
  );
}

export default Items;
