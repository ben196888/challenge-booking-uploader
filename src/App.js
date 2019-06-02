import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Timeline from 'react-calendar-timeline';
import csvtojson from 'csvtojson';
import './App.css';
import 'react-calendar-timeline/lib/Timeline.css';

const apiUrl = 'http://localhost:3001'

const getData = (url = '') => fetch(url).then(response => response.json());
const postData = (url = '', data = {}) =>
  fetch(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => response.json());

class App extends Component {

  state = { bookings: [], newBookings: [] }

  componentWillMount() {
    getData(`${apiUrl}/bookings`)
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

  /**
   * handle the save button
   * saved all new bookings except the overlapped then fetch the bookings again
   *
   * @memberof App
   */
  onSave = async () => {
    const nonOverlapNewBookings = this.state.newBookings.filter(nB => !nB.overlap);
    await Promise.all(nonOverlapNewBookings.map(booking => postData(`${apiUrl}/bookings`, booking)))
      .then(() => getData(`${apiUrl}/bookings`))
      .then((bookings) => { this.setState({ bookings, newBookings: this.state.newBookings.filter(nB => nB.overlap) }) })
  }

  /**
   * Example code from https://github.com/namespace-ee/react-calendar-timeline/tree/master/examples#custom-item-rendering
   *
   * @memberof App
   */
  itemRenderer = ({ item, itemContext, getItemProps, getResizeProps }) => {
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    const backgroundColor = itemContext.selected ? (itemContext.dragging ? 'red' : item.selectedBgColor) : item.bgColor;
    const borderColor = itemContext.resizing ? 'red' : item.color;
    return (
      <div
        {...getItemProps({
          style: {
            backgroundColor,
            color: item.color,
            borderColor,
            borderStyle: 'solid',
            borderWidth: 1,
            borderRadius: 4,
            borderLeftWidth: itemContext.selected ? 3 : 1,
            borderRightWidth: itemContext.selected ? 3 : 1
          },
          onMouseDown: () => {
            console.log('on item click', item);
          }
        })}
      >
        {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}

        <div
          style={{
            height: itemContext.dimensions.height,
            overflow: 'hidden',
            paddingLeft: 3,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {itemContext.title}
        </div>

        {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
      </div>
    );
  };

  render() {
    const groups = [{ id: 1, title: 'group 1' }];
    const items = ([...this.state.bookings, ...this.state.newBookings]).map((booking, i) => ({
      id: i,
      group: 1,
      title: booking.userId,
      start_time: booking.time,
      end_time: booking.time + booking.duration,
      color: booking.overlap ? 'red' : 'black',
      bgColor: booking.overlap ? 'yellow' : booking.savedAt ? 'white' : 'grey'
    }));

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
          <Timeline
            groups={groups}
            items={items}
            stackItems
            itemRenderer={this.itemRenderer}
            defaultTimeStart={new Date('01 Mar 2018 11:00:00 GMT+1000')}
            defaultTimeEnd={new Date('08 Mar 2018 11:00:00 GMT+1000')}
          />
          <button onClick={this.onSave}>Save Non Overlap bookings</button>
        </div>
      </div>
    );
  }
}

export default App;
