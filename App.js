import React, { Component } from "react";  
import {TouchableHighlight,TouchableWithoutFeedback, StyleSheet, View, TextInput, Text, Alert ,Button, ScrollView} from "react-native";  
  
class App extends Component {  
	constructor(props) {
		super(props)
		this.state = {
			AnswerText:'helloo all',
			routeData:[],
			stopsData:[],
			TextInputValueSource: '',
			TextInputValueDestination: '',
			
		}
	}

	GetValueFunction = () =>{
		let routes=[];
		let stops=[];
		this.setState({AnswerText:null});
		const { TextInputValueSource,TextInputValueDestination }  = this.state ;
		Alert.alert(TextInputValueSource+" "+TextInputValueDestination);
		fetch('http://192.168.43.231:5000/routes?src='+TextInputValueSource+'&dest='+TextInputValueDestination)
		.then((response) => response.json())
    			.then((responseJson) => {
    //  				console.log(responseJson);
    //  				this.setState({AnswerText:JSON.stringify(responseJson)});
      				responseJson.map((ele)=>routes.push(ele.route));
      				responseJson.map((ele)=>stops.push(ele.stops));
      				console.log(routes);
      				console.log("Length of array is:"+routes.length);
      				console.log(responseJson);
      				//this.setState({AnswerText:JSON.stringify(responseJson)});
      				this.setState({routeData:routes});
    				this.setState({stopsData:stops});
    			})
    		.catch((error) => {
      			console.error(error);
    		});
     	}  
  
	render() {  
		let cnt=0;
		let textEles=this.state.routeData.map((r)=> {   return(<TouchableHighlight key={r} onPress={()=>{Alert.alert("You clicked me!"+r)}}>
      				<Text style={{textAlign:"center",fontSize:20,padding:20,color:'rgb(0,0,255)',backgroundColor: 'rgb(50,150,120)',margin:5}}>{r+":"+ ++cnt}</Text>
      			</TouchableHighlight>)});
		return (
		<ScrollView>  
      			<View style={styles.container}>  
        		<TextInput  
          			style={styles.textInputStyle}  
          			onChangeText={(TextInputValueSource) => this.setState({TextInputValueSource})}  
          			placeholder="enter source"  
          			placeholderTextColor="red"  
        		/>  
        		<TextInput  
          			style={styles.textInputStyle}  
          			onChangeText={(TextInputValueDestination) => this.setState({TextInputValueDestination})}  
          			placeholder="enter destination"  
          			placeholderTextColor="red"  
        		/>  
         		<Button title="Find Routes" onPress={this.GetValueFunction} color="#2196F3" />
         		<Text>{this.state.AnswerText}</Text>
         		{textEles}
      			{/*<TouchableHighlight onPress={()=>{Alert.alert("You clicked me!")}}>
      				<Text style={{textAlign:"center",fontSize:20,padding:50}}>Click me!!</Text>
      			</TouchableHighlight>*/}
  		</View>
      		</ScrollView>  
    		);  
  	}  
}  
  
const styles = StyleSheet.create({  
	container: {  
    		flex: 1,
    		padding:20  
  	},  
  	textInputStyle: {  
    		borderColor: '#9a73ef',  
    		borderWidth: 1,  
    		height: 40,  
    		margin: 20,  
    		padding: 10,  
  	},  
  	textOutputStyle: {  
    		fontSize: 20  
  	}  
})  
  
export default App;  
