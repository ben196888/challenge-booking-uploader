import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import csvtojson from 'csvtojson';
import './App.css';

const apiUrl = 'http://localhost:3001'

class App extends Component {

  state = { bookings: [], newBookings: [] }

  componentWillMount() {
    fetch(`${apiUrl}/bookings`)
      .then((response) => response.json())
      .then((bookings) => {
        this.setState({ bookings })
      })
  }

  /**
   * handle the dropped files
   * assume all the files are csv format
   * @param {*} files
   * @memberof App
   */
  onDrop = (files) => {
    const reader = new FileReader();
    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => csvtojson()
      .fromString(reader.result)
      .then(jsonObj => {
        const newBookings = jsonObj.map(booking => ({
          userId: booking.userId,
          time: (new Date(booking.time)).getTime(),
          duration: Number(booking.duration) * 60 * 1000 // min to ms
        }));

        newBookings.forEach((nB, i) => {
          // non-overlap condition: A[start, end] <= B[start, end] or B[start, end] <= A[start, end]
          // additional condition between new bookings: different booking (index)
          // TODO: optimise the overlap evaluation with sort
          const isNotOverlap = this.state.bookings.every(b => (nB.time + nB.duration) <= b.time || (b.time + b.duration) <= (nB.time))
            && newBookings.every((b, j) => i === j || (nB.time + nB.duration) <= b.time || (b.time + b.duration) <= (nB.time));
          if (!isNotOverlap) {
            nB.overlap = true;
          }
        });

        this.setState({ newBookings });
      });

    files.forEach(file => reader.readAsText(file));
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <Dropzone
            accept=".csv"
            onDrop={this.onDrop}
          >
            Drag files here
          </Dropzone>
        </div>
        <div className="App-main">
          <p>Existing bookings:</p>
          {
            (this.state.bookings || []).map((booking, i) => {
              const date = new Date(booking.time);
              const duration = booking.duration / (60 * 1000);
              return (
                <p key={i} className="App-booking">
                  <span className="App-booking-time">{date.toString()}</span>
                  <span className="App-booking-duration">{duration.toFixed(1)}</span>
                  <span className="App-booking-user">{booking.userId}</span>
                </p>
              )
            })
          }
        </div>
      </div>
    );
  }
}

export default App;
