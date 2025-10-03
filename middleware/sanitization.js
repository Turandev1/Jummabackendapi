const validator = require("validator");
const xss = require("xss");

const sanitizeinput = (req, resizeBy, next) => {
  const sanitizeobject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = validator.escape(xss(obj[key]));
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeobject(obj[key]);
      }
    }
  };
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};



module.exports=sanitizeinput