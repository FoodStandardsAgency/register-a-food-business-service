// To be run in Robo3t
db.getCollection('cachedRegistrations').find({
    $or: [
      { "status.notifications":
        { "$elemMatch" :
          { sent: { $ne: true } }
        }
      },
      { "status.registration.complete":
          { $ne: true }
      },
      { $and: [
          { "status.tascomi":
              { $exists: true }
          },
          { "status.tascomi.complete":
              { $ne: true }
          }
      ]}
    ]
  }).forEach(function(results)
  {
      print( "Id: " + results._id );
      if (results.metadata) {
        db.cachedRegistrations.update(
            { _id : results._id },
            { $set : { "declaration" : results.metadata } }
        );
        db.cachedRegistrations.update(
            { _id : results._id },
            { $unset: { "metadata":1 } }
        );
      }
      if (results.establishment.operator.operator_company_house_number) {
        db.cachedRegistrations.update(
            { _id : results._id },
            { $set : { "establishment.operator.operator_companies_house_number" : results.establishment.operator.operator_company_house_number } }
        );
        db.cachedRegistrations.update(
            { _id : results._id },
            { $unset: { "establishment.operator.operator_company_house_number":1 } }
        );
      }
  });