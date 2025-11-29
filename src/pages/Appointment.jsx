import React, { useContext, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets_frontend/assets'
import RelatedDoctor from '../components/RelatedDoctor'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {

  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const navigate = useNavigate()
  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

  // Refs for scrolling
  const daysScrollRef = useRef(null)
  const timeSlotsScrollRef = useRef(null)
  const [showDaysLeftArrow, setShowDaysLeftArrow] = useState(false)
  const [showDaysRightArrow, setShowDaysRightArrow] = useState(false)
  const [showTimeSlotsLeftArrow, setShowTimeSlotsLeftArrow] = useState(false)
  const [showTimeSlotsRightArrow, setShowTimeSlotsRightArrow] = useState(false)

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  const getAvailableSlots = async () => {
    setDocSlots([])

    if (!docInfo || !docInfo.slots_booked) return

    // getting current date
    let today = new Date()

    for (let i = 0; i < 7; i++) {
      // getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      // setting end time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      // setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      let timeSlots = []

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()

        const slotDate = day + '_' + month + '_' + year
        const slotTime = formattedTime

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

        if (isSlotAvailable) {
          // add slot to array
          timeSlots.push({ datetime: new Date(currentDate), time: formattedTime })
        }

        // Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      setDocSlots(prev => ([...prev, timeSlots]))
    }
  }

  // Scroll functions for days
  const scrollDaysLeft = () => {
    if (daysScrollRef.current) {
      daysScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
      updateDaysArrowsVisibility()
    }
  }

  const scrollDaysRight = () => {
    if (daysScrollRef.current) {
      daysScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
      updateDaysArrowsVisibility()
    }
  }

  // Scroll functions for time slots
  const scrollTimeSlotsLeft = () => {
    if (timeSlotsScrollRef.current) {
      timeSlotsScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
      updateTimeSlotsArrowsVisibility()
    }
  }

  const scrollTimeSlotsRight = () => {
    if (timeSlotsScrollRef.current) {
      timeSlotsScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
      updateTimeSlotsArrowsVisibility()
    }
  }

  // Update arrow visibility
  const updateDaysArrowsVisibility = () => {
    if (daysScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = daysScrollRef.current
      setShowDaysLeftArrow(scrollLeft > 0)
      setShowDaysRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const updateTimeSlotsArrowsVisibility = () => {
    if (timeSlotsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timeSlotsScrollRef.current
      setShowTimeSlotsLeftArrow(scrollLeft > 0)
      setShowTimeSlotsRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const bookAppointment = async () => {

    if (!token) {
      toast.warn('Login to book appointment')
      return navigate('/login')
    }

    if (!slotTime) {
      toast.warn('Please select a time slot')
      return
    }

    try {

      const date = docSlots[slotIndex][0].datetime

      let day = date.getDate()
      let month = date.getMonth() + 1
      let year = date.getFullYear()

      const slotDate = day + '_' + month + '_' + year

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        // Reset slot selection
        setSlotTime('')
        // Refresh available slots
        getAvailableSlots()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchDocInfo(docInfo)
  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  useEffect(() => {
    console.log(docSlots)
    // Update arrows visibility when slots change
    setTimeout(() => {
      updateDaysArrowsVisibility()
      updateTimeSlotsArrowsVisibility()
    }, 100)
  }, [docSlots])

  useEffect(() => {
    // Update time slots arrows when slot index changes
    setTimeout(() => {
      updateTimeSlotsArrowsVisibility()
    }, 100)
  }, [slotIndex])

  return docInfo && (
    <div>
      {/* ---------- Doctor Details ---------- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          {/* ---------- Doc Info : name, degree, experience ---------- */}
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">{docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" /></p>

          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* ---------- Doctor About ---------- */}
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">About <img src={assets.info_icon} alt="" /></p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>

          <p className="text-gray-500 font-medium mt-4">Appointment fee: <span className='text-gray-600 font-bold'>{currencySymbol}{docInfo.fees}</span></p>
        </div>
      </div>

      {/* ---------- Booking Slots ---------- */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>

        {/* Days Selection with Arrows */}
        <div className="relative">
          {showDaysLeftArrow && (
            <button
              onClick={scrollDaysLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={daysScrollRef}
            className="flex gap-3 items-center w-full overflow-x-scroll mt-4 scrollbar-hide px-8"
            onScroll={updateDaysArrowsVisibility}
          >
            {
              docSlots.length && docSlots.map((item, index) => (
                <div onClick={() => { setSlotIndex(index); setSlotTime('') }} className={`text-center py-6 min-w-16 rounded-full cursor-pointer flex-shrink-0 ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>
                  <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p>
                </div>
              ))
            }
          </div>

          {showDaysRightArrow && (
            <button
              onClick={scrollDaysRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Time Slots Selection with Arrows */}
        <div className="relative mt-4">
          {showTimeSlotsLeftArrow && (
            <button
              onClick={scrollTimeSlotsLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={timeSlotsScrollRef}
            className='flex items-center gap-3 w-full overflow-x-scroll scrollbar-hide px-8'
            onScroll={updateTimeSlotsArrowsVisibility}
          >
            {
              docSlots.length && docSlots[slotIndex].length > 0 ?
                docSlots[slotIndex].map((item, index) => (
                  <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
                    {item.time.toLowerCase()}
                  </p>
                ))
                :
                <p className='text-gray-500 text-sm'>No slots available for this day</p>
            }
          </div>

          {showTimeSlotsRightArrow && (
            <button
              onClick={scrollTimeSlotsRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        <button onClick={bookAppointment} disabled={!slotTime} className={`text-white text-sm font-light px-14 py-3 rounded-full my-6 ${slotTime ? 'bg-primary hover:bg-primary/90' : 'bg-gray-400 cursor-not-allowed'}`}>Book an appointment</button>
      </div>

      {/* Listing Related Doctors */}
      <RelatedDoctor docId={docId} speciality={docInfo.speciality} />

    </div>
  )
}

export default Appointment