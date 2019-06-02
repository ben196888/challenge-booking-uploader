const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); // so that app can access

const bookings = JSON.parse(fs.readFileSync('./server/bookings.json'))
  .map((bookingRecord) => ({
    time: Date.parse(bookingRecord.time),
    duration: bookingRecord.duration * 60 * 1000, // mins into ms
    userId: bookingRecord.user_id,
  }))

/* interface for documentation
interface Booking {
  time: Date,
  duration: number, // (ms)
  userId: string,
  savedAt: Date
}
*/

/**
 * @api {get} /bookings Request bookings list
 * @apiName GetBookings
 * @apiSuccess (200) {Booking[]}
 */
app.get('/bookings', (_, res) => {
  console.debug('get bookings', bookings);
  res.json(bookings);
  console.log('get bookings successful');
});

app.listen(3001);
