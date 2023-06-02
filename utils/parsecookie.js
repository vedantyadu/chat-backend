
const parse_cookie = (str) => {
    
  const dict = {}
  
  if (str) {
      arr = str.split(";")
      for (var i = 0; i < arr.length; i++) {
          arr[i] = arr[i].trim()
      }
      for (var i = 0; i < arr.length; i++) {
          let temp = arr[i].split("=")
          dict[temp[0].trim()] = temp[1] 
      }
  }
  return dict
}


module.exports = parse_cookie
