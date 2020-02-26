const express=require('express');
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
const stop_query="select stop_name from stops where stop_id in(select stop_id from routes where route_id=$1 and stop_seq>=$2 and stop_seq<=$3 order by stop_seq);"
const query="select r1.route_id, r1.stop_seq as R1Stop, r2.stop_seq as R2Stop from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name='Model Colony')) and r1.stop_id in(select stop_id from stops where stop_name='Kusalkar Putala') and r1.stop_seq > r2.stop_seq";
pool.query(query,async function(err,res){
	if(err){
		return console.log('error in connection');
	}
	for(i=0;i<res.rows.length;++i){
		let rid=res.rows[i].route_id;
		pool.query(stop_query,[rid,res.rows[i].r2stop,res.rows[i].r1stop],function findStops(error,result){
			var stops=[];
			for(j=0;j<result.rows.length;++j)
				stops.push(result.rows[j].stop_name);
			rid_stops.push({'route':rid,'stops':stops});
			if(counter==res.rows.length-1){
				app.get('/routes',(req,response)=>{
					response.send(rid_stops)
					console.log(rid_stops);	
				});
			}
			counter++;
		});
	}
});
app.listen(5000,()=>console.log('listening on port 5000'));
