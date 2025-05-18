import Image from 'next/image';
import ReviewCard from './ReviewCard';
import pattern from "@/../public/Svgs/BG Pattern.svg";
import ThemeButton from './ThemeBtn';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'react-slick';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Spinner from './Spinner';


    interface GoogleReview {
        author_name: string;
        profile_photo_url: string;
        rating: number;
        text: string;
        time: number;
        relative_time_description: string;
        author_url?: string;
    }

  
    interface ApiRouteResponse {
        reviews?: GoogleReview[];
        error?: string;
    }


    const Reviews = () => {

    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<String | null>(null);

    const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
  
    useEffect(() => {
      const fetchReviewsFromApiRoute = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await axios.get<ApiRouteResponse>('/api/reviews');
          if (response.data && response.data.reviews) {
            setReviews(response.data.reviews);
          } else if (response.data && response.data.error) {
             console.error("Error from API route:", response.data.error);
             setError(response.data.error);
             setReviews([]);
          } else {
              console.error("Unexpected response structure from API route:", response.data);
              setError("Failed to load reviews due to unexpected server response.");
              setReviews([]);
          }
        } catch (err: any) {
          console.error("Error fetching reviews from API route:", err);
           if (axios.isAxiosError(err)) {
              setError(`Error loading reviews: ${err.response?.data?.error || err.message}`);
           } else {
              setError("An unexpected error occurred while loading reviews.");
           }
           setReviews([]);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchReviewsFromApiRoute();
    }, []);
    
    const sliderSettings = {
        dots: true,
        infinite: false, 
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1, 
        arrows: true,
        responsive: [
          {
            breakpoint: 1024, 
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              infinite: false,
              dots: true
            }
          },
          {
            breakpoint: 640,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              infinite: false,
              dots: true,
              arrows: false
            }
          }
        ]
      };

  return (
    <div
        id='Reviews' 
        className="relative h-full bg-primary-dark"
        style={{
        overflow: "hidden",
        minHeight: '644px',
        alignSelf: "stretch",
        borderRadius: "36px",
        }}
    >
        <div className="absolute h-full w-full">
        <Image
            src={pattern}
            alt="bg pattern"
            fill
            className="object-cover"
        />
        </div>
        
      <div className='z-10'
        style={{
            display: 'flex',
            width: '',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '42px',
            padding: '76px 52px',
        }}
      >

        <div className='z-20'>
            <div className="text-h2 font-awakening text-color-text-primary w-full text-center font-medium">
            What our customers are saying
            </div>

            <div className="text-normal1 text-grey w-full text-center font-medium mt-[20px]">
            Check out our most recent reviews!
            </div>
        </div>

        {/* Reviews Grid - Conditional Rendering */}
        <div className="w-full max-w-6xl">
          {isLoading && 
            <Spinner
              color='black'
            />
          }
          {error && <p className="text-center text-red-600">{error}</p>}
          {!isLoading && !error && reviews.length === 0 && (
             <p className="text-center">No reviews available at the moment.</p>
          )}
          {!isLoading && !error && reviews.length > 0 && (
            <Slider {...sliderSettings} className="mx-[-10px]"> {/* Added negative margin */}
            {reviews.map((review) => (
              // Add padding to the slide element itself
              <div key={review.author_url || `${review.author_name}-${review.time}`} className="px-[10px] h-full">
                <ReviewCard
                  starCount={review.rating}
                  reviewText={review.text}
                  reviewerName={review.author_name}
                  profileImage={review.profile_photo_url}
                />
              </div>
            ))}
          </Slider>
          )}
        </div>

        <div className='z-20'>
            <ThemeButton
                text='Give Us a Review'
                textClassname="pr-[8px] pl-[14px]"
                bgColor='bg-black'
                iconBgColor='bg-primary-dark'
                href='/'
            />
        </div>

    </div>
    <style jsx global>{`
        .slick-prev, .slick-next {
          z-index: 1;
          height: 40px;
          width: 40px;
        }
        .slick-prev:before, .slick-next:before {
          font-size: 30px;
          color: #FFF;
          opacity: 0.5;
        }
        .slick-prev:hover:before, .slick-next:hover:before {
           opacity: 1;
        }
        .slick-prev {
          left: -35px; /* Adjust position */
        }
        .slick-next {
          right: -35px; /* Adjust position */
        }
         @media (max-width: 640px) {
           .slick-prev, .slick-next {
             display: none !important; /* Hide arrows on small screens as configured */
           }
         }

        .slick-dots {
          bottom: -40px;
          color: #fff;
        }

         /* Ensure slides display correctly - Check this in dev tools if issue persists */
        .slick-slide {
           display: inline-block; /* Default slick style, ensure it's not overridden */
           vertical-align: middle;
         }
        .slick-slide > div {
           margin: 0 10px;
         }
        .slick-list {
            margin: 0 -10px; /* Counteract slide margin */
        }

         .slick-track {
            display: flex;
            align-items: stretch; 
         }
         .slick-slide > div {
             height: 100%; 
             display: flex; 
         }
         .slick-slide > div > * {
             flex: 1 1 auto; 
             height: 100%; 
         }


      `}</style>
    </div>
  );
};

export default Reviews;