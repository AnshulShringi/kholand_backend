
export const biasedRandom=(bias:number[], degree:number) =>{
    console.log(`biasedRandom-in bias=${bias} degree=${degree}`)
    let rand = Math.random();
    if (rand < (degree / 100)) {
        rand = Math.floor(Math.random() * bias.length);
        return bias[rand];
    } else {
        rand = Math.ceil(Math.random() * 6);
        return rand;
    }
}

export const failSafe = (fn:CallableFunction)=>{
    try{
        fn();
    }catch(exception){
        console.error(exception);
    }

}

export class Sleep {

    promise:Promise<void>;
    promiseResolve:any;
    timeout:any;

    constructor(duration:number) {
        const scope = this;
        this.promise = new Promise((resolve) => {
            scope.promiseResolve = resolve
            scope.timeout = setTimeout(() => {
                resolve()
            }, duration)
        })
    }

    async wait() {
        return await this.promise
    }

    cancel() {
        clearTimeout(this.timeout)
        this.promiseResolve()
    }
}
