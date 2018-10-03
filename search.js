let express = require('express');
let bodyParser = require('body-parser');
let mongoosastic = require("mongoosastic");

let app = express();
app.use(express.static('static_files'));
app.use(bodyParser.json());

let mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/Restaurant', {useNewUrlParser: true});

let Schema = mongoose.Schema;

let recipeSchema = new Schema({
  name: {
    type: String,
    es_indexed:true,
    es_type:'text'
  },
  ingredients: {
    type: String
  },
  url: {
    type: String
  },
  image: {
    type: String
  },
  cookTime: {
    type: String
  },
  recipeYield: {
    type: String
  },
  prepTime: {
    type: String
  },
  description: {
    type: String
  }
});

recipeSchema.plugin(mongoosastic, {
  hosts: [
    'localhost:9200'
  ]
});

let Recipe = mongoose.model("Recipes", recipeSchema),
  stream = Recipe.synchronize()
  , count = 0;

stream.on('data', function(err, doc){
  count++;
});
stream.on('close', function(){
  console.log('indexed ' + count + ' documents!');
});
stream.on('error', function(err){
  console.log(err);
});

app.get("/search/:term", function(req,res) {
  let val=req.params.term;
  let options = {};
  Recipe.esSearch(
    { query : {
        query_string : {fields : ["name"], query : `*${val}*`}
      },
      size: 50
    }, { hydrate:false }, function(err,results) {
      results.hits.hits.map((each) => {
        options[each._source.name] = null;
      });
      console.log(results.hits.total);
      res.send(options);
    });
});

app.listen(3000, () => {
  console.log(`Started on port 3000`);
});