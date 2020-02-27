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
const stop_query="select stop_name from stops where stop_id in(select stop_id from routes where route_id=$1 and stop_seq>=$2 and stop_seq<=$3 order by stop_seq);"
const query="select r1.route_id, r1.stop_seq as R1Stop, r2.stop_seq as R2Stop from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq";

app.get('/routes',(req,response)=>{
	rid_stops=[];
	counter=0;
	console.log(req.query.src+" "+req.query.dest);
	let source=req.query.src;
	let destination=req.query.dest;
	pool.query(query,[source,destination],function(err,res){
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
				if(counter==(res.rows.length)-1){
					response.send(rid_stops);
					console.log(rid_stops);	
				}
			
				counter++;
			});
		}
	})
});
app.listen(5000,()=>console.log('listening on port 5000'));
