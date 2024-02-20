import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

/*
*   Set default icon
*/
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

/*
*   Define type of data we're requesting
*/
interface Coordinate {
    id: number;
    longitudinal: string;
    lateral: string;
    timeStamp: string;
}

const Body = () => {

    /*
    *   Declare state variables
    *
    *   DataSource of coordinates
    *   Default visible markers count === 5
    */

    const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const [startIndex, setStartIndex] = useState<number>(0);
    const [visibleMarkersCount, setVisibleMarkersCount] = useState<number>(5);


    /*
    *   Axios to retrieve coordiantes and save it to state
    */

    const fetchData = async () => {
        try {
            const response = await axios.get<Coordinate[]>('http://localhost:5000/api/coordinates/getCoordinates');
            setCoordinates(response.data);
        } catch (error) {
            console.error('Error fetching coordinates:', error);
        }
    };

    /*
    *   Fetch data from REST endpoint
    *   Only invoke once
    */

    useEffect(() => {
        fetchData();
    }, []);

    /*
    *   Create sliding window logic  
    */

    /*
    *   If interval is already active don't run again 
    *   Creates new interval
    *   Ensure cycle back to 0 when reaching end of array
    *   Interval set at 1 second
    *   Also start index is saved meaning even if you stop the function you will begin where you left off next time you hit start/continue
    */
    const handleStart = () => {
        if (!intervalId) {
            const newIntervalId = setInterval(() => {
                setStartIndex(prevIndex => (prevIndex + 1) % (coordinates.length - visibleMarkersCount + 1));
            }, 1000);
            setIntervalId(newIntervalId as any);
        }
    };

    /*
    *   If interval is set handleStop will clear the interval
    */
    const handleStop = () => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    /*
    *   Handle amount of markers visible at one time
    *   Also disables the option for the user to input a number higher than the amount of coordinates or negative numbers
    */
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputNumber = parseInt(event.target.value);
        if (!isNaN(inputNumber) && inputNumber >= 1 && inputNumber <= coordinates.length) {
            setVisibleMarkersCount(inputNumber);
        }
    };

    /*
    *   Restart the sliding window alg
    */
    const handleReset = () => {
        setStartIndex(0);
    };

    /*
    *   Using React -leaflet components to create a map and markers
    */

    return (
        <div>
            <input type="number" value={visibleMarkersCount} onChange={handleInputChange} />
            <button onClick={handleStart}>Start/Continue</button>
            <button onClick={handleStop}>Stop</button>
            <button onClick={handleReset}>Reset</button>
            <MapContainer center={[64, 0]} zoom={5} style={{ height: '700px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {coordinates.slice(startIndex, startIndex + visibleMarkersCount).map((coordinate, index) => (
                    <Marker key={index} position={[parseFloat(coordinate.lateral), parseFloat(coordinate.longitudinal)]}>
                        <Popup>
                            Latitude: {coordinate.lateral}, Longitude: {coordinate.longitudinal}, Timestamp: {coordinate.timeStamp}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Body;