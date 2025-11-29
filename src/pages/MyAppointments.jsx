import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + ' ' + months[Number(dateArray[1])] + ' ' + dateArray[2]
  }

  const getUserAppointments = async () => {

    try {

      const { data } = await axios.post(backendUrl + '/api/user/appointments', {}, { headers: { token } })

      if (data.success) {
        setAppointments(data.appointments.reverse())
        console.log('Appointments loaded:', data.appointments)
      } else {
        console.log('Failed to load appointments:', data.message)
        toast.error(data.message)
      }

    } catch (error) {
      console.log('Appointments API error:', error)
      console.log('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || error.message)
    }

  }

  // Helper function to check if appointment time has passed
  const isAppointmentExpired = (slotDate, slotTime) => {
    const [day, month, year] = slotDate.split('_').map(Number)
    const [hour, minute] = slotTime.split(':').map(Number)
    const appointmentDateTime = new Date(year, month - 1, day, hour, minute)
    return appointmentDateTime < new Date()
  }

  const cancelAppointment = async (appointmentId) => {

    try {

      const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }

  }

  useEffect(() => {
    console.log('Token:', token)
    console.log('Backend URL:', backendUrl)
    if (token) {
      getUserAppointments()
    } else {
      console.log('No token found, user might not be logged in')
    }
  }, [token])

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My appointments</p>

      <div>
        {appointments.length === 0 ? (
          <p className='text-center py-8 text-gray-500'>No appointments found. Book an appointment to see it here.</p>
        ) : (
          appointments.map((item, index) => (
            <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
              <div>
                <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
              </div>

              <div className='flex-1 text-sm text-zinc-600'>
                <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                <p>{item.docData.speciality}</p>
                <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                <p className='text-xs'>{item.docData.address.line1}</p>
                <p className='text-xs'>{item.docData.address.line2}</p>
                <p className='text-sm mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>

                {/* Status indicator */}
                <div className='mt-2'>
                  {item.cancelled && (
                    <span className='inline-block px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full'>Cancelled</span>
                  )}
                  {!item.cancelled && item.isCompleted && (
                    <span className='inline-block px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full'>Completed</span>
                  )}
                  {!item.cancelled && !item.isCompleted && isAppointmentExpired(item.slotDate, item.slotTime) && (
                    <span className='inline-block px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full'>Expired</span>
                  )}
                  {!item.cancelled && !item.isCompleted && !isAppointmentExpired(item.slotDate, item.slotTime) && (
                    <span className='inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full'>Scheduled</span>
                  )}
                </div>
              </div>

              <div></div>

              <div className='flex flex-col gap-2 justify-end'>
                {/* Show different buttons based on appointment status */}
                {item.cancelled ? (
                  <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500 cursor-not-allowed'>Appointment Cancelled</button>
                ) : item.isCompleted ? (
                  <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500 cursor-not-allowed'>Appointment Completed</button>
                ) : isAppointmentExpired(item.slotDate, item.slotTime) ? (
                  <button className='sm:min-w-48 py-2 border border-orange-500 rounded text-orange-500 cursor-not-allowed'>Appointment Expired</button>
                ) : (
                  <>
                    <button className='text-sm text-stone-500 sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>
                    <button onClick={() => cancelAppointment(item._id)} className='text-sm text-stone-500 sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel Appointment</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyAppointments