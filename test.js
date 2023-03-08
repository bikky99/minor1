let weight = function (createdDate) {
    const number = 2
    const ln = Math.log(number)
    const lamda = 3
    const weight = Math.pow(Math.E, -( Date.now() - createdDate) * lamda)
    return weight
  }

date = '2023-03-07T18:06:45.187+00:00'

const documentDate = new Date(created_at); // Create a Date instance from the 'created_at' field
const currentDate = new Date(); // Create a Date instance representing the current date and time

const diffInMilliseconds = currentDate.getTime() - documentDate.getTime(); // Calculate the difference in milliseconds
const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24); // Calculate the difference in days

console.log(diffInDays); // Output the difference in days


  console.log(weight(date));