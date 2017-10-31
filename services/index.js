const csv = require('csv');
const async = require('async');
const path = require('path');
const bluebird = require('bluebird');
const diseases = require('../models/disease');

let obj = csv(); 

exports.getSymptoms = function getSymptoms(){
    return new Promise((resolve, reject) => {
        let final_symptoms = [];
        let file_path = path.join(__dirname, '..', 'symptoms.csv');
        
        obj.from.path(file_path).to.array(function(data){
            for(let i=1; i<data.length; i++){
                
                    let symptom = {};
                    symptom.name = data[i][0];
                    symptom.category = data[i][1];

                    final_symptoms.push(symptom);
                
            }
        
            resolve(final_symptoms);
        });
        
    });
};

exports.getAllDiseases = function getAllDiseases(){
    return new Promise((resolve, reject) => {
        let all_diseases = [];
        let file_path = path.join(__dirname, '..', 'bucketmap.csv');

        obj.from.path(file_path).to.array(function(data){
            for(let i=0; i<data.length; i++){

                let disease = {};
                disease.name = data[i][0];
                let symptoms = [];
                let count = 0;
                for(let j=1; j<29; j++){
                    if(data[i][j] != ''){
                        symptoms.push(data[i][j]);
                        count += 1;
                    }
                    else {
                        break;
                    }
                }
                disease.symptoms = symptoms;
                disease.count = count;
                all_diseases.push(disease);
            }

            resolve(all_diseases);

        });

    });
};

exports.calculateProbability = function calculateProbability(data){
    return new Promise((resolve, reject) => {
        //normalize number of symptoms
        let normalized_count = 0;
        let sum = 0;
        let output_diseases = data;

        for(let i=0; i<output_diseases.length; i++){
            sum += output_diseases[i].total_count;
        }
        normalized_count = sum/output_diseases.length;
        console.log(normalized_count);
        let final_sum = 0;
        for(let j=0; j<output_diseases.length; j++){
            output_diseases[j].individual_probability = (output_diseases[j].match_count/normalized_count)*100;
            final_sum += (output_diseases[j].match_count/normalized_count)*100;
        }
        console.log(final_sum);
        for(let k=0; k<output_diseases.length; k++){
            output_diseases[k].relative_probability = (output_diseases[k].individual_probability/final_sum)*100;
        }

        resolve(output_diseases);

    });
};

exports.predictDiseases = function predictDiseases(data){
    return new Promise((resolve, reject) => {
        // return any disease that matches 3 out of 5 symptoms entered by user
        const all = diseases.diseases;
        console.log(all[0].name + all.length);
        let symptoms = [data.s1, data.s2, data.s3, data.s4, data.s5];

        let output = [];
        for(let i=0; i<all.length; i++){
            let disease = {};
            let count = 0;
            for(let j=0; j<5; j++){
                for(let k=0; k<all[i].count; k++){
                    // console.log(all[i].symptoms[k] + ' - ' + symptoms[j]);
                    if(all[i].symptoms[k] == symptoms[j]){
                        count += 1;
                    }
                }
            }
            if(count >= 3){
                disease.name = all[i].name;
                disease.match_count = count;
                disease.total_count = all[i].count;
                console.log('disease');
                output.push(disease);
            }
        }

        this.calculateProbability(output)
        .then((data) => {
            resolve(data);
        })
        .catch((error) => {
            console.log(error);
            reject(error);
        });

    });
};



