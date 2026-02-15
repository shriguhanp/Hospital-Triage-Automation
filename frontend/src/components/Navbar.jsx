import React, { useContext, useState, useEffect, useRef } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import useGeolocation from '../hooks/useGeolocation'

const Navbar = () => {

  const navigate = useNavigate()
  const { token, setToken, userData } = useContext(AppContext)
  const { location, getCurrentPosition, loading: locationLoading } = useGeolocation()

  const [showMenu, setShowMenu] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationRef = useRef(null)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])



  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD] bg-white/80 backdrop-blur-sm sticky top-0 z-50'>
      {/* Logo */}
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />

      {/* Desktop Navigation */}
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/hospitals' >
          <li className='py-1'>HOSPITALS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>

        {/* Health Profile Link (for logged in users) */}
        {token && (
          <NavLink to='/health' >
            <li className='py-1 text-primary'>HEALTH</li>
            <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
          </NavLink>
        )}

        {/* Queue Link (for logged in users) */}
        {token && (
          <NavLink to='/my-queue' >
            <li className='py-1 text-primary'>MY QUEUE</li>
            <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
          </NavLink>
        )}
      </ul>

      {/* Right Section */}
      <div className='flex items-center gap-4'>

        {/* Search Bar */}


        {/* Location Selector */}
        <div className='relative hidden md:block' ref={locationRef}>
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className='flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-full transition-colors'
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className='text-sm text-gray-600'>
              {location ? 'Nearby' : 'Location'}
            </span>
          </button>

          {/* Location Dropdown */}
          {showLocationDropdown && (
            <div className='absolute top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4'>
              {!location ? (
                <div className='text-center'>
                  <p className='text-sm text-gray-600 mb-3'>Enable location to find nearby doctors</p>
                  <button
                    onClick={() => {
                      getCurrentPosition()
                      setShowLocationDropdown(false)
                    }}
                    disabled={locationLoading}
                    className='w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50'
                  >
                    {locationLoading ? 'Getting location...' : 'Enable Location'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className='text-sm text-gray-600 mb-2'>Your location is active</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('userLocation')
                      setShowLocationDropdown(false)
                    }}
                    className='text-sm text-primary hover:underline'
                  >
                    Disable location
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        {token && (
          <button className='relative p-2 hover:bg-gray-100 rounded-full transition-colors'>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className='absolute top-1 right-1 w-2 h-2 bg-primary rounded-full'></span>
          </button>
        )}

        {/* User Menu */}
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={userData.image || assets.profile_pic} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4 shadow-lg'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  {token && <p onClick={() => navigate('/my-queue')} className='hover:text-black cursor-pointer text-primary'>My Queue</p>}
                  <p onClick={logout} className='hover:text-black cursor-pointer text-primary'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }

        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' ><p className='px-4 py-2 rounded full inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/hospitals' ><p className='px-4 py-2 rounded full inline-block'>HOSPITALS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' ><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' ><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/medication' ><p className='px-4 py-2 rounded full inline-block'>MEDICATION</p></NavLink>
            {token && (
              <NavLink onClick={() => setShowMenu(false)} to='/health' >
                <p className='px-4 py-2 rounded full inline-block text-primary font-semibold'>HEALTH</p>
              </NavLink>
            )}
            {token && (
              <NavLink onClick={() => setShowMenu(false)} to='/my-queue' >
                <p className='px-4 py-2 rounded full inline-block text-primary font-semibold'>MY QUEUE</p>
              </NavLink>
            )}
            {!token && (
              <NavLink onClick={() => setShowMenu(false)} to='/login' >
                <p className='px-4 py-2 rounded full inline-block bg-primary text-white'>LOGIN</p>
              </NavLink>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar
