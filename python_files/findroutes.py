def generateRoutes():
	d={}
	cnt=0
	fl=open("latlong.csv","r")
	fr=open("routes.csv","r")
	fw=open("allroutes.csv","w")
	content=fl.read().splitlines()
	for line in content:
		if(content.index(line)==0):
			continue
		stop=line.split(',')
		d.update({(int(stop[0])):((float(stop[2])),(float(stop[3])))})
		
	content=fr.read().splitlines()
	for line in content:
		if(content.index(line)==0):
			fw.write('route id,stop id,stop seq,stage\n')
			continue
		stop=line.split(',')
		key=list(d.keys())[list(d.values()).index(((float(stop[5])),(float(stop[6]))))]
		print(stop[1],',',key,',',stop[2],',',stop[7])
		fw.write(stop[1]+','+str(key)+','+stop[2]+','+stop[7]+'\n')
		cnt=cnt+1
	print(cnt)
generateRoutes()
