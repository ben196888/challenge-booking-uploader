const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); // so that app can access
app.use(express.json()); // parse application/json

let savedAt = new Date();
let bookings = JSON.parse(fs.readFileSync('./server/bookings.json'))
  .map((bookingRecord) => ({
    time: Date.parse(bookingRecord.time),
    duration: bookingRecord.duration * 60 * 1000, // mins into ms
    userId: bookingRecord.user_id,
    savedAt
  }));

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

/**
 * @api {post} /bookings Add new booking
 * @apiName AddBookings
 * @apiSuccess (200) {Booking[]}
 */
app.post('/bookings', (req, res) => {
  savedAt = new Date();
  bookings = [...bookings, { ...req.body, savedAt }];
  console.debug('add bookings', bookings);
  res.status(200).json(bookings);
  console.log('add bookings successful');
});

app.listen(3001);
