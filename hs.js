import fetch from 'node-fetch';

getData(); 

function getData(){
    return fetch('https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=f17d3e1b5c8bc0dba781758f1edf')
    .then((res) => res.json())
    .then((data) => {
        let mappedData = createMap(data)
        let modifiedData = createOrInsertSession(mappedData); 
        let result = {
            sessionsByUser: modifiedData
        }
        sendData(result); 
    })
    .catch((err) => console.log(err)); 
}

function sendData(result){
    return fetch('https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=f17d3e1b5c8bc0dba781758f1edf', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(result)
        }
    ).then((res) => {console.log(res)})
    .catch((err) => {err})
}

function createMap(data){

    let result = new Map(); 

    for(let session of data.events){

        let sessionData ={
            url: session.url, 
            timestamp: session.timestamp
        }; 

        if(!result.has(session.visitorId)){
            result.set(session.visitorId, [])
        }
        result.get(session.visitorId).push(sessionData); 
    }
    return result; 
}

function createOrInsertSession(mappedData){

let result = new Map();

    for(let key of mappedData.keys()){

        mappedData.get(key).sort((a,b) => a.timestamp - b.timestamp);
        let sessions = mappedData.get(key); 

        result.set(key, []); 
        let session = { duration: 0, pages: [(sessions[0].url)], startTime: (sessions[0].timestamp)}; 

        if(sessions.length > 1){
            for(let i = 1; i < sessions.length; i++){

                let difference = sessions[i].timestamp - sessions[i - 1].timestamp;  
                let stableDifference = difference; 

                let daysDifference = Math.floor(difference/1000/60/60/24);
                difference -= daysDifference*1000*60*60*24; 
            
                let hoursDifference = Math.floor(difference/1000/60/60);
                difference -= hoursDifference*1000*60*60; 
            
                let minutesDifference = Math.floor(difference/1000/60);
                difference -= minutesDifference*1000*60; 

                if(daysDifference <= 0 && hoursDifference <= 0 && minutesDifference <= 10){
                    stableDifference = session.duration + stableDifference 
                    session.duration = stableDifference ; 
                    session.pages.push(sessions[i].url); 
                }else{
                    result.get(key).push(session); 
                    session = {}; 
                    session = {
                        duration: 0,
                        pages: [sessions[i].url], 
                        startTime: sessions[i].timestamp
                    }
                }
            }
        }
        result.get(key).push(session); 
    }
    return result; 
}