const socket = io()

const $messageform = document.querySelector('#message-form')
const $messageformButton = $messageform.querySelector('button')
const $messageformInput = $messageform.querySelector('input')
const $locationbutton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New msg element
    const $newMsg = $messages.lastElementChild

    //Height of new element
    const newMsgStyles = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of meessages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(Math.round(containerHeight-newMsgHeight-1)<=Math.round(scrollOffset)){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationMessageTemplate,{
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageformButton.setAttribute('disabled','disabled')
    const msg = e.target.elements.message.value
    socket.emit('sendMessage',msg, (error) => {
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value = ''
        $messageformInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message has been sent.')
    })
})

$locationbutton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    $locationbutton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            $locationbutton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join',{username,room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})