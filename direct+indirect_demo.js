const express=require('express');
var bodyParser = require('body-parser');
const app=express();
const {Pool,Client}=require('pg');
const moment = require('moment');

const pool=new Pool({
	user:'postgres',
	host:'localhost',
	database:'pmpml',
	password:'91298',
	port:5432
});

const stop_query="select stop_name,stop_seq,latitude,longitude from stops,routes where stops.stop_id in(select stop_id from routes where route_id=$1 and stop_seq>=$2 and stop_seq<=$3)and stops.stop_id=routes.stop_id and routes.stop_seq>=$2 and routes.stop_seq<=$3 and routes.route_id=$1 order by stop_seq";

const from_query="select stop_name from stops where stop_id in(select source_stop_id from route_master where route_id=$1)";

const to_query="select stop_name from stops where stop_id in(select destination_stop_id from route_master where route_id=$1)";

const direct_current_time_query="SELECT a1.route_id,a1.trip_id,a1.stop_id,a1.stop_seq as sourceseq,a1.arrivaltime as sourcetime,a2.stop_id,a2.stop_seq as destseq,a2.arrivaltime as desttime from arrivaltime a1 join arrivaltime a2 on a1.trip_id=a2.trip_id WHERE a1.trip_id in (SELECT DISTINCT arrivaltime.trip_id from arrivaltime where route_id in( select r1.route_id from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq))and a2.trip_id in(SELECT DISTINCT arrivaltime.trip_id from arrivaltime where route_id in( select r1.route_id from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq))and a1.stop_id in(select stop_id from stops where stop_name=$1)and a2.stop_id in(select stop_id from stops where stop_name=$2)and a1.arrivaltime > (select current_time) order by a1.arrivaltime limit 3";

const direct_time_query="SELECT a1.route_id,a1.trip_id,a1.stop_id,a1.stop_seq as sourceseq,a1.arrivaltime as sourcetime,a2.stop_id,a2.stop_seq as destseq,a2.arrivaltime as desttime from arrivaltime a1 join arrivaltime a2 on a1.trip_id=a2.trip_id WHERE a1.trip_id in (SELECT DISTINCT arrivaltime.trip_id from arrivaltime where route_id in( select r1.route_id from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq))and a2.trip_id in(SELECT DISTINCT arrivaltime.trip_id from arrivaltime where route_id in( select r1.route_id from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq))and a1.stop_id in(select stop_id from stops where stop_name=$1)and a2.stop_id in(select stop_id from stops where stop_name=$2)and a1.arrivaltime > $3 order by a1.arrivaltime limit $4";

const direct_query="select r1.route_id, r1.stop_seq as R1Stop, r2.stop_seq as R2Stop from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=$1)) and r1.stop_id in(select stop_id from stops where stop_name=$2) and r1.stop_seq > r2.stop_seq";

const freq_query="select valid_max_freq($1,$2)";

const indirect_query="select source_stop_name,destination_stop_name from route_frequency where freq=$1 and (source_stop_name=$2 or destination_stop_name=$2)";

const btwnstop_query="select stop_name from stops where stop_id in(select stop_id from routes where route_id=$1 and stop_seq=$2)";

app.get('/routes',(req,response)=>{
    rid_stops=[];
    direct_routes=[];
    indirect_routes=[];
    btwnstops=[];
    halfroutes=[];
    n=3;
    limit=1;
    mcounter=0;
    kcounter=0;
	console.log(req.query.src+" "+req.query.dest);
	let source=req.query.src;
	let destination=req.query.dest;
    
    
    pool.query(direct_current_time_query,[source,destination],function(err,res){
		for(i=0;i<res.rows.length;++i)
            direct_routes.push({'route':res.rows[i].route_id,'source':source,'destination':destination,'srcseq':res.rows[i].sourceseq,'destseq':res.rows[i].destseq,'source_arrival_time':res.rows[i].sourcetime,'destination_arrival_time':res.rows[i].desttime});  
        console.log('length of direct routes = ',direct_routes.length);
        if(direct_routes.length==0)
            limit=3;    
    });
    


    pool.query(freq_query,[source,destination],function(err,freqs){
        pool.query(indirect_query,[freqs.rows[0].valid_max_freq,source],function(err,result){
            for(j=0;j<result.rows.length;++j){
                if(result.rows[j].source_stop_name==source)
                    btwnstops.push(result.rows[j].destination_stop_name);
                else
                    btwnstops.push(result.rows[j].source_stop_name); 
            }
            for(k=0;k<btwnstops.length;++k){
                pool.query(direct_query,[btwnstops[k],destination],function(err,r){
                    if(r.rows.length>0){
                        for(l=0;l<r.rows.length;++l)
                            halfroutes.push(r.rows[l]);
                    }
                    if(kcounter==btwnstops.length-1){
                        for(m=0;m<halfroutes.length;++m){
                            let rid=halfroutes[m].route_id;
                            pool.query(btwnstop_query,[rid,halfroutes[m].r2stop],function(err,stopnm){
                        	    let btwnstopnm=stopnm.rows[0].stop_name;	
                                pool.query(direct_current_time_query,[source,btwnstopnm],function(err,routes){
                                    try{
                                        if(routes.rows.length==0)
                                            throw new Error('no indirect routes at this time');
                                        pool.query(direct_time_query,[btwnstopnm,destination,routes.rows[0].desttime,limit],function(err,nextroute){
                                            for(nr=0;nr<nextroute.rows.length;++nr)
                                                indirect_routes.push([{'route':routes.rows[0].route_id,'source':source,'destination':btwnstopnm,'srcseq':routes.rows[0].sourceseq,'destseq':routes.rows[0].destseq,'source_arrival_time':routes.rows[0].sourcetime,'destination_arrival_time':routes.rows[0].desttime},{'route':rid,'source':btwnstopnm,'destination':destination,'srcseq':nextroute.rows[nr].sourceseq,'destseq':nextroute.rows[nr].destseq,'source_arrival_time':nextroute.rows[nr].sourcetime,'destination_arrival_time':nextroute.rows[nr].desttime}]);
                                            if(mcounter==halfroutes.length-1){
                                                all_routes=direct_routes.concat(indirect_routes);
                                                all_routes.sort(function(a,b){
                                                    if(a.length==2)
                                                        var dateA = moment(a[1].destination_arrival_time, 'HH:mm:ss');
                                                    else
                                                        var dateA = moment(a.destination_arrival_time, 'HH:mm:ss');
                                                    if(b.length==2)
                                                        var dateB = moment(b[1].destination_arrival_time, 'HH:mm:ss');
                                                    else
                                                        var dateB = moment(b.destination_arrival_time, 'HH:mm:ss');
                                                    return dateA - dateB;
                                                });
                                                console.log('length of all routes = ',all_routes.length);
                                                if(all_routes.length<3)
                                                    n=all_routes.length;
                                                for(ar=0;ar<n;++ar){
                                                    if(all_routes[ar].length==2){
                                                        let rid0=all_routes[ar][0].route;
                                                        let rid1=all_routes[ar][1].route;
                                                        let sseq0=all_routes[ar][0].srcseq;
                                                        let sseq1=all_routes[ar][1].srcseq;
                                                        let dseq0=all_routes[ar][0].destseq;
                                                        let dseq1=all_routes[ar][1].destseq;
                                                        let src0=all_routes[ar][0].source;
                                                        let src1=all_routes[ar][1].source;
                                                        let dest0=all_routes[ar][0].destination;
                                                        let dest1=all_routes[ar][1].destination;
                                                        let st0=all_routes[ar][0].source_arrival_time;
                                                        let st1=all_routes[ar][1].source_arrival_time;
                                                        let dt0=all_routes[ar][0].destination_arrival_time;
                                                        let dt1=all_routes[ar][1].destination_arrival_time;

                                                        pool.query(stop_query,[rid0,sseq0,dseq0],function(err,fstops){
                                                            var firststops=[];
                                                            var secondstops=[];
                                                            for(sp=0;sp<fstops.rows.length;++sp)
                                                                firststops.push({'stop':fstops.rows[sp].stop_name,'latitude':fstops.rows[sp].latitude,'longitude':fstops.rows[sp].longitude});
                                                            pool.query(stop_query,[rid1,sseq1,dseq1],function(err,sstops){
                                                                for(sp=0;sp<sstops.rows.length;++sp)
                                                                    secondstops.push({'stop':sstops.rows[sp].stop_name,'latitude':sstops.rows[sp].latitude,'longitude':sstops.rows[sp].longitude});
                                                                pool.query(from_query,[rid0],function(err,ffrom){
                                                                    pool.query(to_query,[rid0],function(err,fto){
                                                                        pool.query(from_query,[rid1],function(err,sfrom){
                                                                            pool.query(to_query,[rid1],function(err,sto){
                                                                                rid_stops.push([{'route':rid0,'from':ffrom.rows[0].stop_name,'to':fto.rows[0].stop_name,'source':src0,'destination':dest0,'source_arrival_time':st0,'destination_arrival_time':dt0,'stops':firststops},{'route':rid1,'from':sfrom.rows[0].stop_name,'to':sto.rows[0].stop_name,'source':src1,'destination':dest1,'source_arrival_time':st1,'destination_arrival_time':dt1,'stops':secondstops}]);
                                                                                if(rid_stops.length==3){
                                                                                    rid_stops.sort(function(a,b){
                                                                                        if(a.length==2)
                                                                                            var dateA = moment(a[1].destination_arrival_time, 'HH:mm:ss');
                                                                                        else
                                                                                            var dateA = moment(a.destination_arrival_time, 'HH:mm:ss');
                                                                                        if(b.length==2)
                                                                                            var dateB = moment(b[1].destination_arrival_time, 'HH:mm:ss');
                                                                                        else
                                                                                            var dateB = moment(b.destination_arrival_time, 'HH:mm:ss');
                                                                                        return dateA - dateB;
                                                                                    });
                                                                                    console.log('rid stops = ',rid_stops);
                                                                                    console.log('length of rid stops = ',rid_stops.length);
                                                                                    response.send(rid_stops);
                                                                                }
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    }
                                                    else
                                                    {
                                                        let rid0=all_routes[ar].route;
                                                        let sseq0=all_routes[ar].srcseq;
                                                        let dseq0=all_routes[ar].destseq;
                                                        let src0=all_routes[ar].source;
                                                        let dest0=all_routes[ar].destination;
                                                        let st0=all_routes[ar].source_arrival_time;
                                                        let dt0=all_routes[ar].destination_arrival_time;

                                                        pool.query(stop_query,[rid0,sseq0,dseq0],function(err,fstops){
                                                            var firststops=[];
                                                            for(sp=0;sp<fstops.rows.length;++sp)
                                                                firststops.push({'stop':fstops.rows[sp].stop_name,'latitude':fstops.rows[sp].latitude,'longitude':fstops.rows[sp].longitude});
                                                            pool.query(from_query,[rid0],function(err,ffrom){
                                                                pool.query(to_query,[rid0],function(err,fto){
                                                                    rid_stops.push({'route':rid0,'from':ffrom.rows[0].stop_name,'to':fto.rows[0].stop_name,'source':src0,'destination':dest0,'source_arrival_time':st0,'destination_arrival_time':dt0,'stops':firststops});
                                                                    if(rid_stops.length==3){
                                                                        rid_stops.sort(function(a,b){
                                                                            if(a.length==2)
                                                                                var dateA = moment(a[1].destination_arrival_time, 'HH:mm:ss');
                                                                            else
                                                                                var dateA = moment(a.destination_arrival_time, 'HH:mm:ss');
                                                                            if(b.length==2)
                                                                                var dateB = moment(b[1].destination_arrival_time, 'HH:mm:ss');
                                                                            else
                                                                                var dateB = moment(b.destination_arrival_time, 'HH:mm:ss');
                                                                            return dateA - dateB;
                                                                        });
                                                                        console.log('rid stops = ',rid_stops);
                                                                        console.log('length of rid stops = ',rid_stops.length);
                                                                        response.send(rid_stops);
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    }
                                                }
                                            }
                                            mcounter++;
                                        });
                                    }
                                    catch(err){
                                        for(dr=0;dr<direct_routes.length;++dr){
                                            let rid0=all_routes[ar].route;
                                            let sseq0=all_routes[ar].srcseq;
                                            let dseq0=all_routes[ar].destseq;
                                            let src0=all_routes[ar].source;
                                            let dest0=all_routes[ar].destination;
                                            let st0=all_routes[ar].source_arrival_time;
                                            let dt0=all_routes[ar].destination_arrival_time;

                                            pool.query(stop_query,[rid0,sseq0,dseq0],function(err,fstops){
                                                var firststops=[];
                                                for(sp=0;sp<fstops.rows.length;++sp)
                                                    firststops.push({'stop':fstops.rows[sp].stop_name,'latitude':fstops.rows[sp].latitude,'longitude':fstops.rows[sp].longitude});
                                                pool.query(from_query,[rid0],function(err,ffrom){
                                                    pool.query(to_query,[rid0],function(err,fto){
                                                        rid_stops.push({'route':rid0,'from':ffrom.rows[0].stop_name,'to':fto.rows[0].stop_name,'source':src0,'destination':dest0,'source_arrival_time':st0,'destination_arrival_time':dt0,'stops':firststops});
                                                        if(rid_stops.length==direct_routes.length){
                                                            console.log('rid stops = ',rid_stops);
                                                            console.log('length of rid stops = ',rid_stops.length);
                                                            response.send(rid_stops);
                                                        }
                                                    });
                                                });
                                            });
                                        }
                                    }
                                });          
                            });
                        } 
                    }
                    kcounter++; 
                });
            } 
        });
    });
});
app.listen(5000,()=>console.log('listening on port 5000'));
