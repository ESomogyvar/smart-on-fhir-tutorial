(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2',
                              'http://loinc.org|85354-9', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1',
                              'http://loinc.org|8310-5']
                      }
                    }
                  });
        
        var allrgyToll  = smart.patient.api.fetchAll({
                    type: 'AllergyIntolerance',
                  });
        
       
        $.when(pt, obv, allrgyToll).fail(onError);

        $.when(pt, obv, allrgyToll).done(function(patient, obv, allrgyToll) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';
          
          for (let i = 0; i < allrgyToll.length; i++) { // get the  subsection of the  json object that contains the  allergies 
             var  j = allrgyToll[i].code
             //   console.log(JSON.stringify(allrgyToll[i]))
             if (typeof(j.coding[0]) != "undefined")
             {
              var k = j.coding[0]
              console.log( k.display);
              const node = document.createElement("li");
              node.innerHTML = k.display;
              document.getElementById("myList").appendChild(node);
             }                
          }


          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }
          
          //console.log('Em ' + JSON.stringify(allergy[0]));
          //console.log(patient.name[0].family);
          //console.log(fname);
          //console.log('temp' + JSON.stringify(byCodes('8310-5')));
   
          
          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('85354-9'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('85354-9'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var temp = byCodes('8310-5');
          
          //console.log(JSON.stringify(byCodes(temp)));
          //var myTemp = getQuantityValueAndUnit(temp);
          //console.log('Emese '+ getQuantityValueAndUnit(temp[0]));
                     
          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.tmp = getQuantityValueAndUnit(temp[0]);
          p.allrgy = myList;
         
         
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      tmp: {value: ''},
      allrgy: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }  
  }
  

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#tmp').html(p.tmp);
    $('#myList').html(p.allrgy);
  };

})(window);
