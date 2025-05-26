import { 
    FunctionParameter, 
    FunctionReturn, 
    GenericType, 
    JsDocInfo 
} from "~/types"

export type ClassScope =
| "public"
| "protected"
| "private";


export type Decorator = {
    /** The name of the decorator (e.g., 'Injectable', 'Component') */
    name: string;
    /** The arguments passed to the decorator, if any (as strings or parsed values) */
    arguments?: string[]; // or: any[] if you want to support parsed values
    /** The full text of the decorator as it appears in the source */
    text: string;
};

export type ClassMethod = {
    /** the method name */
    name: string;

    /**
     * The level of access this method provides:
     * 
     * 1. public
     * 2. protected
     * 3. private
     */
    scope: ClassScope;

    /**
     * the docs for the given _method_ of a class
     */
    jsDocs: JsDocInfo[];

    isAbstract: boolean;
    isAsync: boolean;
    isGenerator: boolean;

    decorators: Decorator[];

    generics: GenericType[];
    /**
     * The parameters -- including any jsDocs associated with them --
     * which the class method defines
     */
    parameters: FunctionParameter[];
    /**
     * The _type_ returned by the class method (
     * and any assoociated JSDocs associated only to the return type)
     */
    returnType: FunctionReturn;

    toJSON(): string;
    toString(): string;
    toConsole(): string;
}
