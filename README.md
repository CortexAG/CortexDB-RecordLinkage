CortexDB Record Linkage
=======================

find German version of this readme here: [README-DE.md](README-DE.md)

From the point of view of many departments and by adapting legal conditions (GDPR/DSGVO), it is necessary to find and merge a unique data record for each customer, contract or product. Only the finding of the unique data record for a customer or a product makes it possible to find, view and edit all correlations to this initial data record. This "golden record" must therefore be achieved when several database systems are operated.

However, the operation of different databases will inevitably lead to differences in the data management. Even with help tools and interfaces between the systems, typical discrepancies are unavoidable: 
- missing information
- incorrect information
- outdated information
- different data schema (for example, different units for the same specifications)

Before you start
----------------

After the data transfer, the first step is to perform a data cleansing. The type of data, the check for completeness and the validation (e.g. address check) of the data are carried out. In this way, the available information can be cleansed and standardized across the various data sources in order to minimize false matches. A data analysis must then be performed to determine whether the delivered data corresponds to the expectations and value sets.

Once the previous steps have been completed, similar data sets can be linked together. Two main types of linking algorithms are available for this purpose: "deterministic" and "probabilistic".

The deterministic approach
--------------------------

A deterministic algorithm is used to determine whether a data record pair matches or does not match a certain set of identifiers (field contents). The match is evaluated as an "all or nothing" result.

Example: Given are four data records with first and last name:

```
record 1: 	Kerstin Meyer
record 2: 	Kerstin Mayer
record 3: 	Kirsten Meyer
record 4: 	Kirsten Mayer
```

From a deterministic point of view there are only two matches of first names and surnames. Data records 1 and 2 as well as 3 and 4 are identical in the first name; data records 1 and 3 as well as 2 and 4 are identical in the last name. Therefore, there is no 100% match. With the deterministic approach no link is created.

The check for match can therefore only be done over several steps. The comparison of the datasets per field leads to two links for each dataset which can be evaluated with 50% match (one field always matches a field from another dataset; the other does not).

The deterministic approach therefore ignores the fact that certain values have a higher inaccuracy than others. To take this into account, a probabilistic approach must be used.

The probabilistic approach
--------------------------

According to the model developed by Fellegi and Sunter, a difference is made between matches, possible matches and non-matches; based on the calculation of the link points and the use of decision rules. 

see: ["A theory for record linkage", Ivan P. Fellegi and Alan B. Sunter](https://courses.cs.washington.edu/courses/cse590q/04au/papers/Felligi69.pdf)

or: [in German destatis.de: Automated merging of data - The model of Fellegi and Sunter](https://www.destatis.de/DE/Publikationen/WirtschaftStatistik/Gastbeitraege/ZusammenfuehrungDaten42005.pdf?__blob=publicationFile)

The probabilistic approach evaluates the match as probabilities when comparing the field contents.

Example: Four data sets with first and last name are given:

```
record 1: 	Kerstin Meyer
record 2: 	Kerstin Mayer
record 3: 	Kirsten Meyer
record 4: 	Kirsten Mayer
```

The first name `Kerstin` can be changed into a new first name by swapping `i` and `e`. This can happen e.g. by a character shifter during the manual input. This occurrence must be found therefore, in order to be able to determine an evaluation of the deviation.

In order to find deviating, but nearly identical values, new comparison values can be formed from the existing information. For example, phonetic and other algorithms can be used to create additional content for all fields.

Example: Four data sets are given with first and last name with additional fields for phonetic sounds and "normalized" values, in order to find spelling shifts:

```
record		first name	last name	phonetic value		normalized values
record 1: 	Kerstin 	Meyer		CARSTA MAYAR		kneirst mreey
record 2: 	Kerstin 	Mayer		CARSTA MAYAR		kneirst mraey
record 3: 	Kirsten 	Meyer		CARSTA MAYAR		kneirst mreey
record 4: 	Kirsten 	Mayer		CARSTA MAYAR		kneirst mraey
```

The additional values complete the real values by phonetic sounds according to the [NYSIIS standard](https://en.wikipedia.org/wiki/New_York_State_Identification_and_Intelligence_System).

In addition, normalized values are added, which were formed according to an algorithm that follows on from the work of Ernest Rawlinson, "The significance of letter position in word recognition" from 1976. The thesis of Rawlinson's work is based on the assertion that when words are read, they are recognized as "patterns" and not letter by letter. Therefore, a text can be read even if the letters are swapped between the first and last letter of a word.

The algorithm for Rawlinson's normalized values works in lower case and moves the first and last letter to the beginning of the value. The remaining letters are listed in alphabetical order behind it. Therefore the first names `Kerstin` and `Kirsten` are always followed by the same value `kneirst`.

After saving the additional values, the datasets can now be compared again. Over six fields then also for the phonetic sounds and the normalized first name a correspondence is determined. By the determination of similar values the result of the comparison must be evaluated now with a probability, in order to set a link with the possible agreement of similar data sets. This is the manual effort and the real art of record linkage.

Use of CortexDB
---------------

CortexDB allows a schema-free storage of the contents per data record. Therefore any number of values can be stored in a data record and also other algorithms can be used for the generation of further values (e.g. further phonetic or normalized values).

So that additional values can be generated and stored directly during the transaction of a data record, the function of the so-called `Reporter` is available from the database. These allow by a simple configuration the storage of algorithms (in the form of JavaScript code) within the database. For example the phonetic values per field can be calculated and written into further fields. Each reporter is used for exactly one set of rules and one result field. If phonetic, normalized and other values are to be calculated for several fields, each individual reporter must be defined.

The "real" field contents as well as the field contents of the reporter fields are then used to carry out the record linkage. These comparison fields and the weighting must be configured in the record linkage configuration.

Example of record linkage for CortexDB
--------------------------------------

This code is only a functional example (prototype) for performing a record linkage based on CortexDB. Due to the 6th normal form (field index) of CortexDB any number of fields can be compared with each other. No adjustment to the database configuration is necessary.

This example of record linkage allows the configuration of several rules. The following parameters must be set in each rule:

- a search string to find the source data records.
- an array with the fields for comparison from the source data records
- an array with the fields to compare (same number of fields as before)
- a weighting of the result per field comparison (probabilistic)
- the minimum number of fields that must match completely (deterministic).
- minimum points (%) to write a link in a record
- link field for the result (repeating field)
- result field for link (repeating field)
- a boolean value, whether all links are written, even if a link already exists with 100%.

```
"searchVal"     : {"v": [ { "m" : "+", "t" : "s", "f" : "chkStat", "w" : "*", "v" : ["1"]} ]},
'fields'        : ['NameL', 'NameF', 'Street', 'HsNum', 'ZipCode', 'City'],
'search_fields' : ['KANAML', 'KANAMF', 'KASTR', 'KAHNR', 'KAZIP', 'KACTY'],
'weight'        : [50, 50, 50, 50, 50, 50],
"minNumEQfields": 3,
"minPercEQ"     : 85,
'linkField'     : '@pLink',
'linkProb'      : 'pValue',
'strict'        : false
```
As you can see in this code, several rules can be stored in the configuration. Searching and linking via different fields and data records is therefore possible.

Note
----

The given code can be extended at any time and adapted to your own needs.

In addition to the search via the field index (6th normal form) it is also possible to use any regular expression for the search and the comparison per field content.

