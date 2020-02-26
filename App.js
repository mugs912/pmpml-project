/*import React,{Component} from 'react';
import { StyleSheet, Text, View } from 'react-native';
//import StopList from './components/StopList';
import axios from 'axios';

class App extends Component{
  render(){
    return(
      <View style={styles.container}>
      axios.get('http://localhost:5000/routes')
     	.then(
  	(response) => {
    		console.log(response)
  	})
	.catch(
  	(error) => {
    		console.log('error')
  	});
    </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


export default App;*/


import React from 'react';
import axios from 'axios';

export default class Requests extends React.Component {
  state = {
    nameList: []
  }// make the GET request to fetch data from the URL then using promise function to handle response.
   
   componentDidMount() {
    /*fetch('http://192.168.43.231:5000/routes')
      .then(res => {
      	//console.log(res.data);
        //const nameList = res.data;
        //this.setState({ nameList });
        const 
      })
      .catch(
  	(error) => {
    		console.log(error)
  	});*/
  	fetch('http://192.168.43.231:5000/routes')
	.then((response) => response.json())
	.then((responseJson) => {
    		console.log(responseJson)
    	});
  }

  render() {
   //const {nameList} = this.state;
   return null;
   /*return (
      <ul>
        { 
        nameList.map(user => <li>{user.name}</li>)
        }
      </ul>
    )*/
  }
}
