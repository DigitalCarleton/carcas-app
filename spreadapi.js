/*  These are the constants to use for migrating from Sheetdb to Spreadapi
    The spreadapi documentation is here https://spreadapi.roombelt.com/ 
    I have done the Setup steps here (https://spreadapi.roombelt.com/setup) with the following settings:
        User("anonymous", UNSAFE(""), { data: GET });
    This should allow public read only access to the "data" sheet of the Carcas Website Database google sheet
    Follow the documentation for Usage and Examples (https://spreadapi.roombelt.com/usage) to replace the sheetdb api with this new one. 
*/

const url = "https://script.google.com/macros/s/AKfycbwUnbEXCjw4HeuTrlK3c108WDyaTPYywD6mD0P9Xut_wPXw4V-CIyC5VDgqOtw7r4vLaA/exec";
const sheet = "data";