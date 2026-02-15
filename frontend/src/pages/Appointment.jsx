import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData, userData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {

        setDocSlots([])

        // getting current date
        let today = new Date()

        for (let i = 0; i < 7; i++) {

            // getting date with index 
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // Get day name for working hours check
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[currentDate.getDay()];

            // Default working hours if not set
            const dayConfig = docInfo.workingHours && docInfo.workingHours[dayName]
                ? docInfo.workingHours[dayName]
                : { isWorking: true, startTime: '10:00', endTime: '21:00' };

            // If doctor is not working on this day, skip slot generation
            if (!dayConfig.isWorking) {
                setDocSlots(prev => ([...prev, []])) // Empty array for non-working day
                continue;
            }

            const [startHour, startMinute] = dayConfig.startTime.split(':').map(Number);
            const [endHour, endMinute] = dayConfig.endTime.split(':').map(Number);

            // setting end time of the date with index
            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(endHour, endMinute, 0, 0)

            // setting hours 
            if (today.getDate() === currentDate.getDate()) {
                // If it's today, start from next available slot or start time, whichever is later
                let currentHour = currentDate.getHours();
                let currentMinute = currentDate.getMinutes();

                // If current time is past today's end time, no slots for today
                if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
                    setDocSlots(prev => ([...prev, []]))
                    continue;
                }

                // If current time is before start time, set to start time
                if (currentHour < startHour || (currentHour === startHour && currentMinute < startMinute)) {
                    currentDate.setHours(startHour);
                    currentDate.setMinutes(startMinute);
                } else {
                    // Start from next 30 min slot
                    currentDate.setHours(currentDate.getHours() > startHour ? currentDate.getHours() + 1 : startHour) // This creates a bump, let's fix logic
                    // Better logic: round up to next 30 mins
                    if (currentDate.getMinutes() > 30) {
                        currentDate.setHours(currentDate.getHours() + 1);
                        currentDate.setMinutes(0);
                    } else {
                        currentDate.setMinutes(30);
                    }

                    // But we must also ensure we don't start before start time if we are already past it? 
                    // No, if we are past start time, we start from now (rounded up).
                }
            } else {
                currentDate.setHours(startHour)
                currentDate.setMinutes(startMinute)
            }

            let timeSlots = [];


            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year
                const slotTime = formattedTime

                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

                if (isSlotAvailable) {

                    // Add slot to array
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    })
                }

                // Increment current time by 30 minutes
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }

            setDocSlots(prev => ([...prev, timeSlots]))

        }

    }

    // Direct booking without health intake
    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        if (!slotTime) {
            toast.warning('Please select a time slot')
            return
        }

        setBookingLoading(true);

        const date = docSlots[slotIndex][0].datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day + "_" + month + "_" + year

        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/book-appointment',
                { userId: userData._id, docId, slotDate, slotTime },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Appointment Booked Successfully!');
                getDoctosData();
                navigate('/my-appointments');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setBookingLoading(false);
        }
    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    return docInfo ? (
        <div>
            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>

                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

                    {/* ----- Doc Info : name, degree, experience ----- */}

                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" /></p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>

                    {/* ----- Doc About ----- */}
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>

                    <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
                </div>
            </div>

            {/* Booking slots */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p>Booking slots</p>
                <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots.map((item, index) => (
                        <div onClick={() => setSlotIndex(index)} key={index} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}>
                            <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p>{item[0] && item[0].datetime.getDate()}</p>
                        </div>
                    ))}
                </div>

                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots[slotIndex].map((item, index) => (
                        <p onClick={() => setSlotTime(item.time)} key={index} className={`text-sm font-light  flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}>{item.time.toLowerCase()}</p>
                    ))}
                </div>

                <button
                    onClick={bookAppointment}
                    disabled={!slotTime || bookingLoading}
                    className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors'
                >
                    {bookingLoading ? 'Booking...' : slotTime ? 'Book Appointment' : 'Select a time slot first'}
                </button>
            </div>

            {/* Loading Overlay */}
            {bookingLoading && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-xl p-6 shadow-xl text-center'>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className='text-gray-700 font-medium'>Booking your appointment...</p>
                    </div>
                </div>
            )}

            {/* Listing Related Doctors */}
            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment
