const express=require('express');
var bodyParser = require('body-parser');
const app=express();
const {Pool,Client}=require('pg');

const pool=new Pool({
	user:'postgres',
	host:'localhost',
	database:'pmpml',
	password:'91298',
	port:5432
});

var rid_stops=[];
var counter=0;

const stop_query="select stop_name,stop_seq from stops,routes where stops.stop_id in(select stop_id from routes where route_id=$1 and stop_seq>=$2 and stop_seq<=$3)and stops.stop_id=routes.stop_id and routes.stop_seq>=$2 and routes.stop_seq<=$3 and routes.route_id=$1 order by stop_seq";

const direct_query="select r1.route_id, r1.stop_seq as R1Stop, r2.stop_seq as R2Stop from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq";

const freq_query="select valid_max_freq($1,$2)";

const indirect_query="select source_stop_name,destination_stop_name from route_frequency where freq=$1 and (source_stop_name=$2 or destination_stop_name=$2)";

const btwnstop_query="select stop_name from stops where stop_id in(select stop_id from routes where route_id=$1 and stop_seq=$2)";

app.get('/routes',(req,response)=>{
    rid_stops=[];
    btwnstops=[];
    halfroutes=[];
    mcounter=0;
	let source=req.query.src;
    let destination=req.query.dest;
    console.log(source+" "+destination);
    pool.query(freq_query,[source,destination],function(err,freqs){
        pool.query(indirect_query,[freqs.rows[0].valid_max_freq,source],function(err,result){
            for(j=0;j<result.rows.length;++j){
                if(result.rows[j].source_stop_name==source)
                    btwnstops.push(result.rows[j].destination_stop_name);
                else
                    btwnstops.push(result.rows[j].source_stop_name); 
            }
            console.log(btwnstops);
            for(k=0;k<btwnstops.length;++k){
                pool.query(direct_query,[btwnstops[k],destination],function(err,r){
                    if(r.rows.length>0){
                        for(l=0;l<r.rows.length;++l)
                            halfroutes.push(r.rows[l]);
                        console.log(halfroutes);
                    }
                    for(m=0;m<halfroutes.length;++m){
                        let rid=halfroutes[m].route_id;
                        pool.query(btwnstop_query,[rid,halfroutes[m].r2stop],function(err,stopnm){
                            pool.query(direct_query,[source,stopnm.rows[0].stop_name],function(err,routes){
                                for(n=0;n<routes.rows.length;++n)
                                    rid_stops.push([{'route':routes.rows[n].route_id,'source':source,'destination':stopnm.rows[0].stop_name},{'route':rid,'source':stopnm.rows[0].stop_name,'destination':destination}]);
                                if(mcounter==halfroutes.length-1){
                                    console.log(rid_stops);
                                    console.log(rid_stops.length);
                                }
                                mcounter++;
                            });
                                        
                        });
                    }   
                });
            } 
        });
    });
});

app.listen(5000,()=>console.log('listening on port 5000'));
