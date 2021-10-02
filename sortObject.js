module.exports = function sortObject(object) { 
   const sortObject = Object.keys(object).sort().reduce(
      (obj, key) => {
         obj[key] = object[key];
         return obj;
      },{}
   )
   return sortObject;
};