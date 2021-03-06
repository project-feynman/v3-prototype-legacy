import firebase from 'firebase/app'
import db from '@/firebase/init.js'
export { askNotificationPermission, sendSubscriptionToFirestore, getSubscription }

var currentSubInDb = false
var sub = undefined
var uid = undefined
var publicVapidKey = 'BBC2Ob2X8oKIOTZ8No75dd47WC9OgVgzvmjCAtVV3r6h9ohQZIlGfXl-bEVu1KQ3xQNmGRuynUy4NFch0rY4etE'
//const messaging = firebase.messaging()
//messaging.usePublicVapidKey("BJ0Ou0MdMi6KAqeA8BOcmsFkzYCX0Uw5WmXZorqcgZX1Uf55bpJjbvb-Hq5eFajOXwI-j-w-D-o7X7J5FWJ34y4")

//this functions is really really bad, probably should work somehow in sync with the subscription or sth
const getSubscription = () => {
	return sub
}
//this function is BAD. to fix
const askNotificationPermission = async () => {
	await Notification.requestPermission(result => { })
}

const sendSubscriptionToFirestore = async (user_id = undefined, subscription = undefined) => {
  if(!currentSubInDb) {
		if(user_id && !uid) {
			console.log('uid given')
			uid = user_id
		}
		if(subscription && !sub) {
			console.log('sub given')
			sub = subscription
		}
		if(uid && sub) {
			console.log('both here wooo')
			const ref = db.collection('users').doc(uid)
			const snapshot = await ref.get()
			const doc = snapshot.data()
			const sub = JSON.stringify(getSubscription())
			if(!doc.subscriptions) {
				doc.subscriptions = []
			}
			if(!sub) {
				return
			}
			if(doc.subscriptions.includes(sub)) {
				currentSubInDb = true
			}
			else {
				doc.subscriptions.push(sub)
				ref.set(doc)
				currentSubInDb = true
			}
		}
  }
}


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

if ('Notification' in window && 'serviceWorker' in navigator) {
	askNotificationPermission()
  navigator.serviceWorker
	.register('/sw.js')
	.then(registration => {
		const applicationServerKey = urlBase64ToUint8Array(publicVapidKey)
		const subscribeOptions = {
			applicationServerKey,
			userVisibleOnly: true
		}
		registration.pushManager.getSubscription().then(function(subscription) {
			if(subscription)
			{
				const applicationServerKeyArray = new Uint8Array(subscription.options.applicationServerKey)
				var areApplicationServerKeysSame = true
				
				for(var i = 0; i < applicationServerKeyArray.length; i++) {
					if(applicationServerKeyArray[i] == applicationServerKey[i]) {
						areApplicationServerKeysSame = false
						break
					}
				}
			}
			if(!subscription || areApplicationServerKeysSame) {
				registration.pushManager.subscribe(subscribeOptions).then(newSubscription => sendSubscriptionToFirestore(undefined, subscription))
			}
			else {
				sendSubscriptionToFirestore(undefined, subscription)
			}
		}) 
	})
	.catch(error => console.log('error =', error))
}
