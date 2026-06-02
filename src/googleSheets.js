const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOgN55QNFFSMphxutTlotm7XmEujT9xihv1UbB0XAOo2VvP-I5wN3Sh0XLu0P__K-ryQ/exec';

export async function saveOrderToSheets(order) {
  try {
    const url =
      SCRIPT_URL +
      '?tableNumber=' +
      order.tableNumber +
      '&items=' +
      encodeURIComponent(order.items) +
      '&totalPrice=' +
      order.totalPrice +
      '&status=جدید';
    await fetch(url, { method: 'GET', mode: 'no-cors' });
    return true;
  } catch (err) {
    console.error('Sheets error:', err);
    return false;
  }
}

export async function getOrdersFromSheets() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    return data;
  } catch (err) {
    return [];
  }
}
