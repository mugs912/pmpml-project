import React, { Component } from "react";  
import { StyleSheet, View, TextInput, Text, Alert ,Button, ScrollView} from "react-native";  
  
class App extends Component {  
	constructor(props) {
		super(props)
		this.state = {
			AnswerText:'helloo all',
			AnswerText1:'hellooo',
			TextInputValueSource: '',
			TextInputValueDestination: '',
		}
	}

	GetValueFunction = () =>{
		let routes=[];
		this.setState({AnswerText:null});
		const { TextInputValueSource,TextInputValueDestination }  = this.state ;
		Alert.alert(TextInputValueSource+" "+TextInputValueDestination);
		fetch('http://192.168.43.231:5000/routes?src='+TextInputValueSource+'&dest='+TextInputValueDestination)
		.then((response) => response.json())
    			.then((responseJson) => {
      				responseJson.map((ele)=>routes.push(ele.route));
      				console.log(routes);
      				console.log("Length of array is:"+routes.length);
      				console.log(responseJson);
      				this.setState({AnswerText:JSON.stringify(responseJson)});
      				this.setState({AnswerText1:String(routes)});
      				
    			})
    		.catch((error) => {
      			console.error(error);
    		});
     	}  
  
	render() {  
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
         		<Text>{this.state.AnswerText1}</Text>
      			</View>
      		</ScrollView>  
    		);  
  	}  
}  
  
const styles = StyleSheet.create({  
	container: {  
    		flex: 1  
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
