const doubleRequest = options => {
  const target = options.url.split("/").pop();
  if (target === "online_food_business_registrations") {
    const response = Object.assign(options.form, { id: "25" });
    return JSON.stringify(response);
  } else {
    let response;
    if (isNaN(target)) {
      response = {
        id: 0
      };
    } else {
      response = {
        id: target,
        online_reference: options.form.online_reference
      };
    }
    return JSON.stringify(response);
  }
};

module.exports = { doubleRequest };
