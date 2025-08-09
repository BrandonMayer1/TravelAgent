import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

const httpService = new HttpService();

const getApiKey = () => {
    const key = process.env.AVIATIONSTACK_KEY;
    return key;
};
export const tools = [

    {
        name: "filterFlights",
        description: "returns flights matching the attributes of departure airport IATA code, arrival airport IATA code, flight date, and airline ",
        parameters: {
            type: "object",
            properties: {
                flightLimit: {type: "string", description: "The amount of flights returned"},
                depIATA: {type: "string", description: "The departure IATA code"},
                arrIATA: {type: "string", description: "The arival IATA code"},
                airlineName: {type: "string", description: "The name of the airline"}
            },
        },
        func: async ({
        flightLimit = 10,
        depIATA,
        arrIATA,
        airlineName
        }: {
        flightLimit?: number | string;
        depIATA: string;
        arrIATA?: string;
        airlineName?: string;
        }) => {
            console.log('TEMP: filterFlights tool called with params:', {
                flightLimit, depIATA, arrIATA, airlineName
            });
            const API_KEY = getApiKey();
            if (!API_KEY){
                throw new Error("NO API KEY");
            }
            let url = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}`;
            if (depIATA) url += `&dep_iata=${depIATA}`;
            if (arrIATA) url += `&arr_iata=${arrIATA}`;
            if (airlineName) url += `&airline_name=${encodeURIComponent(airlineName)}`;
            if (flightLimit) url += `&limit=${String(flightLimit)}`;

            try{
                const response = await lastValueFrom(httpService.get(url));
                console.log('TEMP: Flights API response received, data count:', response.data.data?.length);
                return response.data.data;
            }
            catch (err){
                throw new Error(err);
            }
        }
    }

    
];